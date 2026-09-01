# -*- coding: utf-8 -*-
 
import json
from odoo import http
from odoo.http import request
from odoo.exceptions import ValidationError


class WebsiteForm(http.Controller):

    @http.route(
        '/website/recaptcha/',
        type='http',
        auth='public',
        methods=['GET'],
        website=True,
        multilang=False,
    )
    def recaptcha_public(self):
        ICP = request.env['ir.config_parameter'].sudo()
        site_key = (
            ICP.get_param('recaptcha.key.site')
            or ICP.get_param('website_form_recaptcha.site_key')
        )
        if not site_key:
            rec_site = request.env.ref(
                'website_form_recaptcha.recaptcha_key_site',
                raise_if_not_found=False,
            )
            if rec_site:
                site_key = rec_site.sudo().value
        return json.dumps({
            'site_key': site_key or '',
        })

    def extract_data(self, **kwargs):
        """ Inject ReCaptcha validation into pre-existing data extraction """
        captcha_obj = request.env['website.form.recaptcha']
        ip_addr = request.httprequest.environ.get('HTTP_X_FORWARDED_FOR')
        if ip_addr:
            ip_addr = ip_addr.split(',')[0].strip()
        else:
            ip_addr = request.httprequest.remote_addr
        try:
            captcha_obj.action_validate(
                kwargs.get(captcha_obj.RESPONSE_ATTR), ip_addr
            )
        except ValidationError:
            raise ValidationError([captcha_obj.RESPONSE_ATTR])
        return True

