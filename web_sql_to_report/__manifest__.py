# -*- coding: utf-8 -*-
{
    'name': "Web SQL to Report",
    'summary': "Create formatted Excel (.xlsx) reports from query results or list of dictionary data",
    'description': """
Web SQL to Report for Odoo 20
=============================
Auto generate styled XLSX reports from SQL query results or list-of-dictionary structures.

Key Features:
-------------
* Automatic data type detection (Integer, Float, Date, DateTime).
* Auto-adjust column width based on content.
* Supports Title, Date range, and custom Summary Headers.
* Freeze Panes, Numbering, and Auto Filter options.
* Multi-sheet support.
* Dynamic Totals/Footers with SUM or custom calculations.
* Downloadable directly via Odoo Web Client.
    """,
    'author': "Liong",
    'website': "https://www.linkedin.com/in/nagara-liong-50ab07136/",
    'category': 'Productivity/Reporting',
    'version': '20.0.1.0.0',
    'license': 'LGPL-3',
    'images': ['static/description/cover.png'],
    'depends': ['base', 'web'],
    'external_dependencies': {
        'python': ['xlsxwriter'],
    },
    'data': [
        'security/ir.model.access.csv',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
}
