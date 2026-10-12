# -*- coding: utf-8 -*-

# 1: imports of python lib

# 2: import of known third party lib
import werkzeug.exceptions

# 3:  imports of odoo
from odoo import http, SUPERUSER_ID
from odoo.http import request

# 4:  imports from odoo modules
from odoo.addons.web.controllers.database import Database

# 5: local imports

# 6: Import of unknown third party lib


class DatabaseSecurity(Database):

    def _check_superuser_access(self):
        uid = request.session.uid
        if not uid:
            werkzeug.exceptions.abort(request.redirect('/web/login'))
        if uid != SUPERUSER_ID:
            raise werkzeug.exceptions.Forbidden()

    @http.route('/web/database/selector', type='http', auth="none")
    def selector(self, **kw):
        self._check_superuser_access()
        return super().selector(**kw)

    @http.route('/web/database/manager', type='http', auth="none")
    def manager(self, **kw):
        self._check_superuser_access()
        return super().manager(**kw)

    @http.route('/web/database/create', type='http', auth="none", methods=['POST'], csrf=False)
    def create(self, master_pwd, name, lang, password, **post):
        self._check_superuser_access()
        return super().create(master_pwd, name, lang, password, **post)

    @http.route('/web/database/duplicate', type='http', auth="none", methods=['POST'], csrf=False)
    def duplicate(self, master_pwd, name, new_name, neutralize_database=False):
        self._check_superuser_access()
        return super().duplicate(master_pwd, name, new_name, neutralize_database=neutralize_database)

    @http.route('/web/database/drop', type='http', auth="none", methods=['POST'], csrf=False)
    def drop(self, master_pwd, name):
        self._check_superuser_access()
        return super().drop(master_pwd, name)

    @http.route('/web/database/backup', type='http', auth="none", methods=['POST'], csrf=False)
    def backup(self, master_pwd, name, backup_format='zip'):
        self._check_superuser_access()
        return super().backup(master_pwd, name, backup_format=backup_format)

    @http.route('/web/database/restore', type='http', auth="none", methods=['POST'], csrf=False, max_content_length=None)
    def restore(self, master_pwd, backup_file, name, copy=False, neutralize_database=False):
        self._check_superuser_access()
        return super().restore(master_pwd, backup_file, name, copy=copy, neutralize_database=neutralize_database)

    @http.route('/web/database/change_password', type='http', auth="none", methods=['POST'], csrf=False)
    def change_password(self, master_pwd, master_pwd_new):
        self._check_superuser_access()
        return super().change_password(master_pwd, master_pwd_new)

    @http.route('/web/database/list', type='json', auth='none')
    def list(self):
        uid = request.session.uid
        if not uid or uid != SUPERUSER_ID:
            raise werkzeug.exceptions.Forbidden()
        return super().list()
