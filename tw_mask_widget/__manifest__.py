# -*- coding: utf-8 -*-
{
    'name': "Mask Widget",
    'summary': "Widget to mask sensitive data (phone, email, ID) in Form, List, and Kanban views",
    'version': '20.0.1.0.0',
    'category': 'Web',
    'author': "Liong",
    'website': "https://www.linkedin.com/in/nagara-liong-50ab07136/",
    'license': 'LGPL-3',
    'price': 5,
    'currency': 'USD',
    'depends': ['web'],
    'data': [
        'security/res_groups.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'tw_mask_widget/static/src/css/mask_widget.css',
            'tw_mask_widget/static/src/xml/mask_widget.xml',
            'tw_mask_widget/static/src/js/mask_widget.js',
        ],
    },
    'images': [
        'static/description/banner.png',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
    'description': """
Sensitive Information Masking Widget for Odoo 20
================================================
Protect sensitive customer and business data across your Odoo database.

Key Features:
-------------
* **Multi-View OWL Masking**: Seamlessly masks sensitive data in Form view, List view, and Kanban view.
* **Smart Masking Algorithms**: Built-in mask presets for Phone numbers, Emails, and Identification/IDs.
* **Many2one Support**: Special widget `many2one_mask_sensitive` to mask related records in form views.
* **Role-based Access Control**: Users assigned to the 'Masking Admin' group can see full unmasked values.
* **Intuitive Edit Experience**: Field displays masked value until focused; leaves existing value untouched if unedited.

Masking Presets:
----------------
* Phone: `08*********2` (shows first 2 and last 1 digit)
* Email: `j******e@e******.com` (masks local part and domain name)
* ID: `3171**********78` (shows first 4 and last 2 digits)

Usage in XML Views:
-------------------
.. code-block:: xml

    <field name="mobile" widget="mask_sensitive" options="{'mask_type': 'phone'}"/>
    <field name="work_email" widget="mask_sensitive" options="{'mask_type': 'email'}"/>
    <field name="identification_id" widget="mask_sensitive" options="{'mask_type': 'id'}"/>
    <field name="partner_id" widget="many2one_mask_sensitive" options="{'mask_type': 'id'}"/>
""",
}
