# -*- coding: utf-8 -*-
from odoo import models, api


class ResUsers(models.Model):
    _inherit = 'res.users'

    @api.model
    def check_mask_admin(self):
        """
        Check if current user has Masking Admin group.
        Called from JavaScript to determine if masking should be applied.
        Returns True if user can see unmasked data, False otherwise.
        """
        admin_group = self.env.ref('web_mask_widget.group_masking_admin', raise_if_not_found=False)
        if admin_group:
            return admin_group.id in self.env.user.groups_id.ids
        return False

