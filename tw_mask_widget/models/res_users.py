# -*- coding: utf-8 -*-
from odoo import models, api


class ResUsers(models.Model):
    _inherit = 'res.users'

    @api.model
    def check_mask_admin(self):
        """
        Check if current user has Masking Admin group.
        Returns True if user can see unmasked data, False otherwise.
        """
        return self.env.user.has_group('tw_mask_widget.group_masking_admin')
