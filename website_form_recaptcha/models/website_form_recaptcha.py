# -*- coding: utf-8 -*-
 

import requests
from odoo import api, models
from odoo.exceptions import ValidationError


class WebsiteFormRecaptcha(models.AbstractModel):
    """ This model provides ReCaptcha helper methods.
    Nothing is stored in the DB.
    """

    _name = 'website.form.recaptcha'
    _description = 'Website Form Recaptcha Validations'
    URL = 'https://www.google.com/recaptcha/api/siteverify'
    RESPONSE_ATTR = 'g-recaptcha-response'
    ERROR_MAP = {
        'missing-input-secret': 'The secret parameter is missing.',
        'invalid-input-secret':
            'The secret parameter is invalid or malformed.',
        'missing-input-response': 'The response parameter is missing.',
        'invalid-input-response':
            'The response parameter is invalid or malformed.',
        None: 'There was a problem with the captcha entry.',
    }

    @api.model
    def action_validate(self, response, remote_ip):
        """ Validate ReCaptcha Response
        Params:
            response: str The value of 'g-recaptcha-response'.
            remote_ip: str The end user's IP address
        Raises:
            ValidationError on failure
        Returns:
            True on success
        """
        ICP = self.env['ir.config_parameter'].sudo()
        active = ICP.get_param('recaptcha.active', '1')
        if active == '0':
            return True

        secret_key = (
            ICP.get_param('recaptcha.key.secret')
            or ICP.get_param('website_form_recaptcha.secret_key')
        )
        if not secret_key:
            rec_secret = self.env.ref(
                'website_form_recaptcha.recaptcha_key_secret',
                raise_if_not_found=False,
            )
            if rec_secret:
                secret_key = rec_secret.sudo().value

        if not secret_key:
            raise ValidationError(
                self.ERROR_MAP.get('missing-input-secret', self.ERROR_MAP[None])
            )

        data = {
            'secret': secret_key,
            'response': response,
            'remoteip': remote_ip,
        }
        res = requests.post(self.URL, data=data).json()

        for error in res.get('error-codes', []):
            raise ValidationError(
                self.ERROR_MAP.get(
                    error, self.ERROR_MAP[None]
                )
            )

        if not res.get('success'):
            raise ValidationError(self.ERROR_MAP[None])

        return True

