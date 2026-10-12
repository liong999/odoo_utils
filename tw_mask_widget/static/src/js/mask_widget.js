/** @odoo-module **/

import { Component, useRef, useState, onWillStart, useEffect } from "@odoo/owl";
import { _t } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useService, useBus } from "@web/core/utils/hooks";
import { Many2OneField, many2OneField } from "@web/views/fields/many2one/many2one_field";

/**
 * Cache admin group check across fields to minimize RPC overhead
 */
let isMaskAdminCache = null;
let maskAdminPromise = null;

async function checkIsMaskAdmin(userService) {
    if (isMaskAdminCache !== null) {
        return isMaskAdminCache;
    }
    if (!maskAdminPromise) {
        maskAdminPromise = userService
            .hasGroup("tw_mask_widget.group_masking_admin")
            .then((res) => {
                isMaskAdminCache = Boolean(res);
                return isMaskAdminCache;
            })
            .catch(() => {
                isMaskAdminCache = false;
                return false;
            });
    }
    return maskAdminPromise;
}

function repeatChar(char, count) {
    return count > 0 ? char.repeat(count) : "";
}

function maskPhone(value) {
    if (!value || value.length <= 3) return value || "";
    const showStart = 2;
    const showEnd = 1;
    const maskLength = value.length - showStart - showEnd;
    return value.substring(0, showStart) + repeatChar("*", maskLength) + value.slice(-showEnd);
}

function maskEmail(value) {
    if (!value) return "";
    const parts = value.split("@");
    if (parts.length !== 2) return value;
    const local = parts[0];
    const domain = parts[1];

    let maskedLocal;
    if (local.length <= 2) {
        maskedLocal = local[0] + "*";
    } else {
        maskedLocal = local[0] + repeatChar("*", local.length - 2) + local.slice(-1);
    }

    const domainParts = domain.split(".");
    let maskedDomain;
    if (domainParts.length >= 2) {
        const mainDomain = domainParts[0];
        if (mainDomain.length <= 1) {
            maskedDomain = mainDomain + repeatChar("*", 5);
        } else {
            maskedDomain = mainDomain[0] + repeatChar("*", mainDomain.length - 1);
        }
        maskedDomain += "." + domainParts.slice(1).join(".");
    } else {
        maskedDomain = domain[0] + repeatChar("*", domain.length - 1);
    }

    return maskedLocal + "@" + maskedDomain;
}

function maskId(value) {
    if (!value || value.length <= 6) return value || "";
    const showStart = 4;
    const showEnd = 2;
    const maskLength = value.length - showStart - showEnd;
    return value.substring(0, showStart) + repeatChar("*", maskLength) + value.slice(-showEnd);
}

function maskValue(value, maskType = "phone") {
    if (!value) return "";
    const str = String(value);
    switch (maskType) {
        case "email":
            return maskEmail(str);
        case "id":
            return maskId(str);
        case "phone":
        default:
            return maskPhone(str);
    }
}

function maskMany2One(value, maskType = "id") {
    if (!value) return "";
    const str = String(value);
    switch (maskType) {
        case "email":
            return maskEmail(str);
        case "phone":
            return maskPhone(str);
        case "id":
        default:
            if (str.length > 5) {
                const showStart = 2;
                const showEnd = 3;
                const maskLength = str.length - showStart - showEnd;
                return str.substring(0, showStart) + repeatChar("*", maskLength) + str.slice(-showEnd);
            }
            return maskId(str);
    }
}

export class MaskSensitiveField extends Component {
    static template = "tw_mask_widget.MaskSensitiveField";
    static props = {
        ...standardFieldProps,
        placeholder: { type: String, optional: true },
        maskType: { type: String, optional: true },
    };
    static defaultProps = {
        maskType: "phone",
    };

    setup() {
        this.inputRef = useRef("input");
        this.userService = useService("user");
        this.state = useState({
            isMaskAdmin: false,
            isFocused: false,
        });
        this.hasUserTyped = false;

        onWillStart(async () => {
            this.state.isMaskAdmin = await checkIsMaskAdmin(this.userService);
        });

        useEffect(() => {
            if (this.inputRef.el && !this.props.readonly) {
                if (this.state.isMaskAdmin) {
                    this.inputRef.el.value = this.rawValue;
                } else if (!this.state.isFocused) {
                    this.inputRef.el.value = this.maskedValue;
                    this.hasUserTyped = false;
                }
            }
        });

        const { model } = this.props.record;
        if (model && model.bus) {
            useBus(model.bus, "NEED_LOCAL_CHANGES", (ev) => {
                if (this.hasUserTyped && this.inputRef.el && this.inputRef.el.value !== "") {
                    ev.detail.proms.push(
                        this.props.record.update({ [this.props.name]: this.inputRef.el.value })
                    );
                }
            });
        }
    }

    get rawValue() {
        const val = this.props.record.data[this.props.name];
        return val !== undefined && val !== null ? String(val) : "";
    }

    get maskType() {
        return this.props.maskType || "phone";
    }

    get maskedValue() {
        return maskValue(this.rawValue, this.maskType);
    }

    get displayValue() {
        return this.state.isMaskAdmin ? this.rawValue : this.maskedValue;
    }

    onFocus() {
        if (!this.state.isMaskAdmin) {
            this.state.isFocused = true;
            if (!this.hasUserTyped && this.inputRef.el) {
                this.inputRef.el.value = "";
            }
        }
    }

    onInput() {
        this.hasUserTyped = true;
    }

    async onBlur() {
        this.state.isFocused = false;
        if (!this.inputRef.el) return;

        if (!this.state.isMaskAdmin) {
            const inputVal = this.inputRef.el.value;
            if (!this.hasUserTyped || inputVal === "" || inputVal === this.maskedValue) {
                // If unmodified or cleared without entry: restore masked display without touching DB value
                this.inputRef.el.value = this.maskedValue;
                this.hasUserTyped = false;
            } else {
                // New value typed: update the record
                await this.props.record.update({ [this.props.name]: inputVal });
            }
        } else {
            // Admin: standard save
            if (this.hasUserTyped) {
                await this.props.record.update({ [this.props.name]: this.inputRef.el.value });
                this.hasUserTyped = false;
            }
        }
    }

    onKeydown(ev) {
        if (ev.key === "Enter") {
            ev.target.blur();
        }
    }
}

export const maskSensitiveField = {
    component: MaskSensitiveField,
    displayName: _t("Sensitive Mask"),
    supportedTypes: ["char", "text"],
    extractProps: ({ attrs, options }) => ({
        placeholder: attrs.placeholder,
        maskType: options.mask_type || "phone",
    }),
};

registry.category("fields").add("mask_sensitive", maskSensitiveField);

export class Many2OneMaskSensitiveField extends Many2OneField {
    static props = {
        ...Many2OneField.props,
        maskType: { type: String, optional: true },
    };

    setup() {
        super.setup();
        this.userService = useService("user");
        this.maskState = useState({
            isMaskAdmin: false,
        });
        onWillStart(async () => {
            this.maskState.isMaskAdmin = await checkIsMaskAdmin(this.userService);
        });
    }

    get displayName() {
        const rawName = super.displayName;
        if (this.maskState.isMaskAdmin || !rawName) {
            return rawName;
        }
        return maskMany2One(rawName, this.props.maskType || "id");
    }
}

export const many2OneMaskSensitiveField = {
    ...many2OneField,
    component: Many2OneMaskSensitiveField,
    displayName: _t("Many2one Mask"),
    extractProps: (fieldInfo, dynamicInfo) => {
        const props = many2OneField.extractProps(fieldInfo, dynamicInfo);
        props.maskType = fieldInfo.options?.mask_type || "id";
        return props;
    },
};

registry.category("fields").add("many2one_mask_sensitive", many2OneMaskSensitiveField);
