==================
TW Mask Widget 18.0
==================

Sensitive Information Masking Widget for Odoo 18.0 (OWL).

This module provides modern OWL field widgets (``mask_sensitive`` and ``many2one_mask_sensitive``) to mask sensitive information like phone numbers, emails, and identification IDs across Form, List, and Kanban views.

Key Features
============

* **Multi-View Masking**: Automatically masks values in Form views, List views, and Kanban cards via native OWL components.
* **Presets for Common PII**:
  * Phone numbers: ``08*********2`` (shows first 2 and last 1 characters)
  * Email addresses: ``j******e@e******.com`` (masks local name and main domain)
  * Identification / ID: ``3171**********78`` (shows first 4 and last 2 characters)
* **Non-Destructive Edit UX**:
  * Field displays masked value until focused.
  * On focus/click, input clears cleanly for new user entry.
  * If left empty on blur, original value is safely preserved.
* **Access Control**: Users in the ``Masking Admin`` security group can see full unmasked values.
* **Many2one Support**: Special ``many2one_mask_sensitive`` widget for relational fields.

Usage
=====

To use this widget in XML views, specify ``widget="mask_sensitive"`` and optional ``mask_type``:

Form View
---------

.. code-block:: xml

    <field name="mobile" widget="mask_sensitive" options="{'mask_type': 'phone'}"/>
    <field name="work_email" widget="mask_sensitive" options="{'mask_type': 'email'}"/>
    <field name="identification_id" widget="mask_sensitive" options="{'mask_type': 'id'}"/>
    <field name="partner_id" widget="many2one_mask_sensitive" options="{'mask_type': 'id'}"/>

List View
---------

.. code-block:: xml

    <list string="Contacts">
        <field name="name"/>
        <field name="phone" widget="mask_sensitive" options="{'mask_type': 'phone'}"/>
        <field name="email" widget="mask_sensitive" options="{'mask_type': 'email'}"/>
    </list>

Kanban View
-----------

.. code-block:: xml

    <field name="mobile" widget="mask_sensitive" options="{'mask_type': 'phone'}"/>

Security & Configuration
========================

To allow specific users (managers, compliance officers) to view unmasked data:

1. Go to **Settings > Users & Companies > Users**.
2. Select the target user.
3. In the **Access Rights** tab, find **Masking** category and check **Masking Admin**.
4. Save. The user will now see full unmasked information.

Author & Maintainer
===================

* **Author**: Liong
* **Website**: https://www.linkedin.com/in/nagara-liong-50ab07136/
