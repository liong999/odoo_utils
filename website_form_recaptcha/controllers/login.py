# -*- coding: utf-8 -*-
import json
import urllib
import urllib2

from odoo import http, SUPERUSER_ID, _
from odoo.http import request
from odoo.addons.web.controllers.main import ensure_db, Home


def _render_login(values):
    """Render web.login with a complete context (esp. for auth_oauth)."""
    values = dict(values or {})
    # preserve redirect if present
    if 'redirect' not in values:
        values['redirect'] = request.params.get('redirect') or ''
    # inject OAuth providers if module is installed
    if 'auth.oauth.provider' in request.env:
        try:
            from odoo.addons.auth_oauth.controllers.main import OAuthLogin
            values['providers'] = OAuthLogin().list_providers()
        except Exception:
            # fall back to empty list rather than crashing the template
            values['providers'] = []
    try:
        values['databases'] = http.db_list()
    except Exception:
        values['databases'] = None
    return request.render('web.login', values)


class HomeRecaptcha(Home):
    @http.route()
    def web_login(self, *args, **kw):
        ensure_db()
        if request.httprequest.method == 'POST':
            ICP = request.env['ir.config_parameter'].sudo()
            active = ICP.get_param('recaptcha.active', '0')
            if active == '1':
                token = kw.get('g-recaptcha-response') or ''
                if not token:
                    return _render_login(dict(kw, error=_("Please confirm you're human.")))

                secret = (
                    ICP.get_param('website_form_recaptcha.secret_key')
                    or ICP.get_param('recaptcha.key.secret')
                )
                if not secret:
                    rec_secret = request.env.ref(
                        'website_form_recaptcha.recaptcha_key_secret',
                        raise_if_not_found=False,
                    )
                    if rec_secret:
                        secret = rec_secret.sudo().value

                if not secret:
                    return _render_login(dict(kw, error=_("reCAPTCHA is misconfigured (missing secret key).")))

                try:
                    resp = urllib2.urlopen(
                        'https://www.google.com/recaptcha/api/siteverify',
                        data=urllib.urlencode({
                            'secret': secret,
                            'response': token,
                            'remoteip': request.httprequest.remote_addr or '',
                        }), timeout=3)
                    result = json.loads(resp.read() or '{}')
                except Exception:
                    result = {'success': False}

                if not result.get('success'):
                    return _render_login(dict(kw, error=_("reCAPTCHA failed. Please try again.")))
        response = super(HomeRecaptcha, self).web_login(*args, **kw)
        return response