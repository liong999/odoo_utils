====================
TW Database Security
====================

Restrict Database Manager and Selector URLs to Superuser only.

This module provides enterprise-level database protection for Odoo by restricting access to:

* ``/web/database/selector``
* ``/web/database/manager``
* ``/web/database/create``
* ``/web/database/duplicate``
* ``/web/database/drop``
* ``/web/database/backup``
* ``/web/database/restore``
* ``/web/database/change_password``
* ``/web/database/list`` (JSON-RPC)

Security Mechanism
==================

1. **Anonymous Visitors**: Automatically redirected to ``/web/login``.
2. **Authenticated Standard / Admin Users**: Blocked with an immediate ``HTTP 403 Forbidden`` error.
3. **Superuser (ID 1 / OdooBot)**: Granted access to manage databases securely.

Installation
============

1. Place the module in your custom addons folder.
2. Update Apps list and install ``tw_security_db``.
3. Zero additional configuration required.

Author & Maintainer
===================

* **Author**: Tunas Honda
* **Website**: https://www.honda-ku.com
