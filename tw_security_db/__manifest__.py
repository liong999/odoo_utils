# -*- coding: utf-8 -*-
{
    'name': "TW Database Security",
    'summary': "Restrict Database Manager and Selector URLs to Superuser only",
    'description': """
        Module to restrict access to /web/database/manager, /web/database/selector,
        and all database management endpoints (create, duplicate, drop, backup, restore)
        to superuser only.
    """,
    'author': "Tunas Honda",
    'website': "https://www.linkedin.com/in/nagara-liong-50ab07136/",
    'category': 'Extra Tools',
    'version': '20.0.1.0.0',
    'license': 'LGPL-3',
    'images': ['static/description/banner.png'],
    'depends': ['base', 'web'],
    'data': [],
    'installable': True,
    'application': False,
    'auto_install': False,
}

