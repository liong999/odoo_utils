# -*- coding: utf-8 -*-
{
    'name': 'Web Login Captcha',
    'version': '20.0.1.0.0',
    'summary': 'Add Google reCAPTCHA to Backend Login, for admin and backoffice users',
    'category': 'Website',
    'author': "Liong",
    'website': "https://www.linkedin.com/in/nagara-liong-50ab07136/",
    'depends': ['web', 'google_recaptcha'],
    'data': [
        'views/login_templates.xml',
        'views/res_config_settings_view.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'web_login_captcha/static/src/js/login_captcha.js',
        ],
    },
    'images': ['static/description/banner.png'],
    'installable': True,
    'application': False,
    'license': 'LGPL-3',
    'price': 15,
    'currency': 'USD',
}
