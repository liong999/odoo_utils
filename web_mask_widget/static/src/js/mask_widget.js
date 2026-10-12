/**
 * Sensitive Information Masking Widget for Odoo 8
 *
 * This widget masks sensitive information in view mode and provides
 * a special edit behavior where the field shows masked value until focused.
 *
 * Usage:
 *   <field name="mobile" widget="mask_sensitive" options="{'mask_type': 'phone'}"/>
 *   <field name="work_email" widget="mask_sensitive" options="{'mask_type': 'email'}"/>
 *   <field name="identification_id" widget="mask_sensitive" options="{'mask_type': 'id'}"/>
 *
 * mask_type options:
 *   - 'phone': 08*********2 (show first 2, last 1)
 *   - 'email': j******e@e******.com
 *   - 'id': 3171**********78 (show first 4, last 2)
 */
odoo.define("web_mask_widget.mask_sensitive", function (require) {
  "use strict";

  var core = require("web.core");
  var form_widgets = require("web.form_widgets");
  var Model = require("web.Model");
  var list_widget_registry = core.list_widget_registry;

  // Cache the admin check result to avoid repeated RPC calls
  var _is_admin_cache = null;
  var _admin_check_promise = null;

  /**
   * Check if current user has Masking Admin group
   * Returns a deferred that resolves to true/false
   */
  function checkIsAdmin() {
    if (_admin_check_promise !== null) {
      return _admin_check_promise;
    }

    var UsersModel = new Model("res.users");
    _admin_check_promise = UsersModel.call("check_mask_admin", [])
      .then(function (result) {
        _is_admin_cache = result;
        return result;
      })
      .fail(function () {
        // If check fails, default to masking (safer)
        _is_admin_cache = false;
        return false;
      });

    return _admin_check_promise;
  }

  var FieldMaskSensitive = form_widgets.FieldChar.extend({
    init: function (field_manager, node) {
      this._super(field_manager, node);
      this.original_value = null;
      this.is_focused = false;
      this.user_modified = false;
      this.is_admin = _is_admin_cache; // Use cached value if available
    },

    /**
     * Override start to check admin status before rendering
     */
    start: function () {
      var self = this;
      var res = this._super();

      // If admin status not yet checked, check it now
      if (_is_admin_cache === null) {
        checkIsAdmin().then(function (is_admin) {
          self.is_admin = is_admin;
          // Re-render if we're an admin (to show unmasked value)
          if (is_admin) {
            self.render_value();
          }
        });
      } else {
        this.is_admin = _is_admin_cache;
      }

      return res;
    },

    /**
     * Mask a value based on the configured mask_type
     * If user is admin, return unmasked value
     * @param {string} value - The original value to mask
     * @returns {string} - The masked value (or original if admin)
     */
    mask_value: function (value) {
      if (!value) return "";
      var str_value = String(value);

      // Skip masking for admin users
      if (this.is_admin) {
        return str_value;
      }

      var mask_type = this.options.mask_type || "phone";

      switch (mask_type) {
        case "email":
          return this._mask_email(str_value);
        case "id":
          return this._mask_id(str_value);
        case "phone":
        default:
          return this._mask_phone(str_value);
      }
    },

    /**
     * Mask phone number: show first 2 and last 1 character
     * Example: 083981231232 -> 08*********2
     */
    _mask_phone: function (value) {
      if (value.length <= 3) return value;
      var show_start = 2;
      var show_end = 1;
      var mask_length = value.length - show_start - show_end;
      return (
        value.substring(0, show_start) +
        this._repeat_char("*", mask_length) +
        value.slice(-show_end)
      );
    },

    /**
     * Mask email: mask local and domain parts
     * Example: john.doe@example.com -> j******e@e******.com
     */
    _mask_email: function (value) {
      var parts = value.split("@");
      if (parts.length !== 2) return value;

      var local = parts[0];
      var domain = parts[1];

      // Mask local part: show first and last character
      var masked_local;
      if (local.length <= 2) {
        masked_local = local[0] + "*";
      } else {
        masked_local =
          local[0] + this._repeat_char("*", local.length - 2) + local.slice(-1);
      }

      // Mask domain: mask the main domain name before the TLD
      var domain_parts = domain.split(".");
      var masked_domain;
      if (domain_parts.length >= 2) {
        var main_domain = domain_parts[0];
        if (main_domain.length <= 1) {
          masked_domain = main_domain + this._repeat_char("*", 5);
        } else {
          masked_domain =
            main_domain[0] + this._repeat_char("*", main_domain.length - 1);
        }
        masked_domain += "." + domain_parts.slice(1).join(".");
      } else {
        masked_domain = domain[0] + this._repeat_char("*", domain.length - 1);
      }

      return masked_local + "@" + masked_domain;
    },

    /**
     * Mask ID/KTP: show first 4 and last 2 characters
     * Example: 3171011234567890 -> 3171******90
     */
    _mask_id: function (value) {
      if (value.length <= 6) return value;
      var show_start = 4;
      var show_end = 2;
      var mask_length = value.length - show_start - show_end;
      return (
        value.substring(0, show_start) +
        this._repeat_char("*", mask_length) +
        value.slice(-show_end)
      );
    },

    /**
     * Helper to repeat a character n times (for IE compatibility)
     */
    _repeat_char: function (char, count) {
      var result = "";
      for (var i = 0; i < count; i++) {
        result += char;
      }
      return result;
    },

    /**
     * Override render_value to handle masking in both view and edit modes
     */
    render_value: function () {
      var self = this;
      var value = this.get("value") || "";

      // Store original value for later use
      this.original_value = value;

      if (!this.get("effective_readonly")) {
        // Edit mode
        this._super();

        // After rendering, set masked value in the input
        var $input = this.$("input");
        if ($input.length && !this.is_focused) {
          $input.val(this.mask_value(value));
        }

        // Setup focus/blur handlers
        this._setup_edit_handlers();
      } else {
        // View mode: show masked value
        var masked = this.mask_value(value);
        this.$el.text(masked);
      }
    },

    /**
     * Setup handlers for focus/blur events in edit mode
     */
    _setup_edit_handlers: function () {
      var self = this;
      var $input = this.$("input");

      if (!$input.length) return;

      // Remove any existing handlers to prevent duplicates
      $input.off("focus.mask_widget blur.mask_widget");

      // On focus: clear the field for user input
      $input.on("focus.mask_widget", function () {
        self.is_focused = true;
        if (!self.user_modified) {
          $(this).val("");
        }
      });

      // On blur: if empty, restore masked value; otherwise mark as modified
      $input.on("blur.mask_widget", function () {
        self.is_focused = false;
        var current_val = $(this).val();

        if (current_val === "" || current_val === null) {
          // User didn't enter anything, restore masked display
          $(this).val(self.mask_value(self.original_value));
          self.user_modified = false;
        } else {
          // User entered a new value
          self.user_modified = true;
        }
      });
    },

    /**
     * Override get_value to return the correct value for saving
     */
    get_value: function () {
      var $input = this.$("input");
      if ($input.length) {
        var input_val = $input.val();
        var masked_original = this.mask_value(this.original_value);

        // If the input shows masked value or is empty, return original
        if (
          input_val === masked_original ||
          input_val === "" ||
          input_val === null
        ) {
          return this.original_value;
        }
        // Otherwise return the new user-entered value
        return input_val;
      }
      return this._super();
    },

    /**
     * Override internal_set_value to handle the value properly
     */
    internal_set_value: function (value) {
      var $input = this.$("input");
      if ($input.length) {
        var input_val = $input.val();
        var masked_original = this.mask_value(this.original_value);

        // If user is viewing masked value, keep the original
        if (input_val === masked_original) {
          return;
        }
      }
      this._super(value);
    },

    /**
     * Reset state when form is saved/discarded
     */
    destroy: function () {
      this.original_value = null;
      this.is_focused = false;
      this.user_modified = false;
      this._super();
    },
  });

  // Register the widget
  core.form_widget_registry.add("mask_sensitive", FieldMaskSensitive);

  /**
   * List/Tree View Column for Masking
   * This handles the display in tree/list views
   */
  var ListView = require("web.ListView");
  var MaskSensitiveColumn = ListView.Column.extend({
    /**
     * Masking helper functions (same as form widget)
     */
    _repeat_char: function (char, count) {
      var result = "";
      for (var i = 0; i < count; i++) {
        result += char;
      }
      return result;
    },

    _mask_phone: function (value) {
      if (!value || value.length <= 3) return value || "";
      var show_start = 2;
      var show_end = 1;
      var mask_length = value.length - show_start - show_end;
      return (
        value.substring(0, show_start) +
        this._repeat_char("*", mask_length) +
        value.slice(-show_end)
      );
    },

    _mask_email: function (value) {
      if (!value) return "";
      var parts = value.split("@");
      if (parts.length !== 2) return value;

      var local = parts[0];
      var domain = parts[1];

      var masked_local;
      if (local.length <= 2) {
        masked_local = local[0] + "*";
      } else {
        masked_local =
          local[0] + this._repeat_char("*", local.length - 2) + local.slice(-1);
      }

      var domain_parts = domain.split(".");
      var masked_domain;
      if (domain_parts.length >= 2) {
        var main_domain = domain_parts[0];
        if (main_domain.length <= 1) {
          masked_domain = main_domain + this._repeat_char("*", 5);
        } else {
          masked_domain =
            main_domain[0] + this._repeat_char("*", main_domain.length - 1);
        }
        masked_domain += "." + domain_parts.slice(1).join(".");
      } else {
        masked_domain = domain[0] + this._repeat_char("*", domain.length - 1);
      }

      return masked_local + "@" + masked_domain;
    },

    _mask_id: function (value) {
      if (!value || value.length <= 6) return value || "";
      var show_start = 4;
      var show_end = 2;
      var mask_length = value.length - show_start - show_end;
      return (
        value.substring(0, show_start) +
        this._repeat_char("*", mask_length) +
        value.slice(-show_end)
      );
    },

    mask_value: function (value, options, is_admin) {
      if (!value) return "";
      var str_value = String(value);

      // Skip masking for admin users
      if (is_admin) {
        return str_value;
      }

      var mask_type = (options && options.mask_type) || "phone";

      switch (mask_type) {
        case "email":
          return this._mask_email(str_value);
        case "id":
          return this._mask_id(str_value);
        case "phone":
        default:
          return this._mask_phone(str_value);
      }
    },

    /**
     * Override _format to mask the value in list view
     */
    _format: function (row_data, options) {
      var value = row_data[this.id] ? row_data[this.id].value : "";

      // Parse options from the column definition
      var col_options = {};
      if (this.options) {
        try {
          if (typeof this.options === "string") {
            col_options = JSON.parse(this.options.replace(/'/g, '"'));
          } else {
            col_options = this.options;
          }
        } catch (e) {
          col_options = {};
        }
      }

      // Use cached admin status
      var is_admin = _is_admin_cache || false;

      return this.mask_value(value, col_options, is_admin);
    },
  });

  // Register the list column type
  list_widget_registry.add("field.mask_sensitive", MaskSensitiveColumn);

  /**
   * Many2One Field for Masking
   * We need to override the display logic to mask the string representation
   * of the relation field, but keep its backend ID processing intact.
   */
  var FieldMany2OneMaskSensitive = core.form_widget_registry.get("many2one").extend({
    display_string: function (str) {
      if (!str) {
        this._super(str);
        return;
      }

      // Parse options to get mask_type
      var col_options = {};
      if (this.node && this.node.attrs && this.node.attrs.options) {
        try {
          if (typeof this.node.attrs.options === "string") {
            col_options = JSON.parse(this.node.attrs.options.replace(/'/g, '"'));
          } else {
            col_options = this.node.attrs.options;
          }
        } catch (e) {
          col_options = {};
        }
      }

      var is_admin = _is_admin_cache || false;
      var masked_val = str;

      if (!is_admin && str) {
        var mask_type = (col_options && col_options.mask_type) || "id"; // Default to id for many2one

        var _repeat_char = function (char, count) {
          var result = "";
          for (var i = 0; i < count; i++) {
            result += char;
          }
          return result;
        };

        var str_value = String(str);
        switch (mask_type) {
          case "email":
            var parts = str_value.split("@");
            if (parts.length === 2) {
              var local = parts[0];
              var domain = parts[1];

              var masked_local;
              if (local.length <= 2) {
                masked_local = local[0] + "*";
              } else {
                masked_local =
                  local[0] + _repeat_char("*", local.length - 2) + local.slice(-1);
              }

              var domain_parts = domain.split(".");
              var masked_domain;
              if (domain_parts.length >= 2) {
                var main_domain = domain_parts[0];
                if (main_domain.length <= 1) {
                  masked_domain = main_domain + _repeat_char("*", 5);
                } else {
                  masked_domain =
                    main_domain[0] + _repeat_char("*", main_domain.length - 1);
                }
                masked_domain += "." + domain_parts.slice(1).join(".");
              } else {
                masked_domain = domain[0] + _repeat_char("*", domain.length - 1);
              }
              masked_val = masked_local + "@" + masked_domain;
            }
            break;
          case "id":
            if (str_value.length > 5) {
              var show_start = 2;
              var show_end = 3;
              var mask_length = str_value.length - show_start - show_end;
              masked_val =
                str_value.substring(0, show_start) +
                _repeat_char("*", mask_length) +
                str_value.slice(-show_end);
            }
            break;
          case "phone":
          default:
            if (str_value.length > 3) {
              var show_start = 2;
              var show_end = 1;
              var mask_length = str_value.length - show_start - show_end;
              masked_val =
                str_value.substring(0, show_start) +
                _repeat_char("*", mask_length) +
                str_value.slice(-show_end);
            }
            break;
        }
      }

      // Call original method with our masked string
      this._super(masked_val);
      
      // If not readonly, we might want the user to know it's masked, 
      // but in Many2One Odoo handles autocomplete dynamically, 
      // so this just sets the visual display string.
    },
    
    // Also override focus to clear the search easily if clicked (optional flavor)
    focus: function () {
        var res = this._super();
        var is_admin = _is_admin_cache || false;
        if (!is_admin && !this.get('effective_readonly') && this.$input && this.$input.val().indexOf('*') !== -1) {
            this.$input.val(''); // Clear on focus to allow typeseach naturally
        }
        return res;
    }
  });

  // Register the Many2one mask widget
  core.form_widget_registry.add("many2one_mask_sensitive", FieldMany2OneMaskSensitive);


  /**
   * Kanban View Field for Masking
   * This handles the display in kanban views
   */
  var kanban_widgets = require("web_kanban.widgets");
  var AbstractField = kanban_widgets.AbstractField;

  var MaskSensitiveKanban = AbstractField.extend({
    renderElement: function () {
      var value = this.field.raw_value;

      // Parse options from the column definition
      var col_options = {};
      if (this.options) {
        try {
          if (typeof this.options === "string") {
            col_options = JSON.parse(this.options.replace(/'/g, '"'));
          } else {
            col_options = this.options;
          }
        } catch (e) {
          col_options = {};
        }
      }

      // Use cached admin status
      var is_admin = _is_admin_cache || false;

      // Masking logic
      var str_value = String(value || "");
      if (!value) str_value = "";
      var masked_val = str_value;

      if (!is_admin && str_value) {
        var mask_type = (col_options && col_options.mask_type) || "phone";

        var _repeat_char = function (char, count) {
          var result = "";
          for (var i = 0; i < count; i++) {
            result += char;
          }
          return result;
        };

        switch (mask_type) {
          case "email":
            var parts = str_value.split("@");
            if (parts.length === 2) {
              var local = parts[0];
              var domain = parts[1];

              var masked_local;
              if (local.length <= 2) {
                masked_local = local[0] + "*";
              } else {
                masked_local =
                  local[0] + _repeat_char("*", local.length - 2) + local.slice(-1);
              }

              var domain_parts = domain.split(".");
              var masked_domain;
              if (domain_parts.length >= 2) {
                var main_domain = domain_parts[0];
                if (main_domain.length <= 1) {
                  masked_domain = main_domain + _repeat_char("*", 5);
                } else {
                  masked_domain =
                    main_domain[0] + _repeat_char("*", main_domain.length - 1);
                }
                masked_domain += "." + domain_parts.slice(1).join(".");
              } else {
                masked_domain = domain[0] + _repeat_char("*", domain.length - 1);
              }
              masked_val = masked_local + "@" + masked_domain;
            }
            break;
          case "id":
            if (str_value.length > 6) {
              var show_start = 2;
              var show_end = 4;
              var mask_length = str_value.length - show_start - show_end;
              masked_val =
                str_value.substring(0, show_start) +
                _repeat_char("*", mask_length) +
                str_value.slice(-show_end);
            }
            break;
          case "phone":
          default:
            if (str_value.length > 3) {
              var show_start = 2;
              var show_end = 1;
              var mask_length = str_value.length - show_start - show_end;
              masked_val =
                str_value.substring(0, show_start) +
                _repeat_char("*", mask_length) +
                str_value.slice(-show_end);
            }
            break;
        }
      }

      this.$el.text(masked_val);
    },
  });

  kanban_widgets.registry.add("mask_sensitive", MaskSensitiveKanban);

  return {
    FieldMaskSensitive: FieldMaskSensitive,
    MaskSensitiveColumn: MaskSensitiveColumn,
    MaskSensitiveKanban: MaskSensitiveKanban,
    FieldMany2OneMaskSensitive: FieldMany2OneMaskSensitive,
  };
});
