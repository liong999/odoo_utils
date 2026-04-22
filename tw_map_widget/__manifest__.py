# -*- coding: utf-8 -*-
{
    'name': "TW Map Widget",
    'summary': """
        A Map Widget integrating with base_geolocalize (Google Maps & OpenStreetMap/Leaflet)
    """,
    'description': """
        This module provides an OWL field widget for Maps.
        It supports OpenStreetMap (via Leaflet.js) and Google Maps API based on settings in base_geolocalize.
    """,
    'author': "Liong",
    'website': "https://www.linkedin.com/in/nagara-liong-50ab07136/",
    'category': 'Hidden',
    'version': '18.0.1.0.0',
    'depends': ['base', 'web', 'base_geolocalize'],
    'data': [
        # views, security, etc.
    ],
    'assets': {
        'web.assets_backend': [
            'tw_map_widget/static/src/css/map_widget.css',
            'tw_map_widget/static/src/xml/map_widget.xml',
            'tw_map_widget/static/src/js/map_widget.js',
        ],
    },
    'installable': True,
    'application': False,
    'auto_install': False,
}
