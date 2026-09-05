/* @ds-bundle: {"format":4,"namespace":"CyRokxDesignSystem_ef2ebf","components":[{"name":"EventCard","sourcePath":"components/cards/EventCard.jsx"},{"name":"TicketTierRow","sourcePath":"components/cards/TicketTierRow.jsx"},{"name":"Avatar","sourcePath":"components/display/Avatar.jsx"},{"name":"StatCard","sourcePath":"components/display/StatCard.jsx"},{"name":"Tag","sourcePath":"components/display/Tag.jsx"},{"name":"Badge","sourcePath":"components/feedback/Badge.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"FilterControl","sourcePath":"components/forms/FilterControl.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"SearchBar","sourcePath":"components/forms/SearchBar.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"Icon","sourcePath":"components/icons/Icon.jsx"},{"name":"DataTable","sourcePath":"components/layout/DataTable.jsx"},{"name":"Footer","sourcePath":"components/layout/Footer.jsx"},{"name":"Modal","sourcePath":"components/layout/Modal.jsx"},{"name":"Navbar","sourcePath":"components/layout/Navbar.jsx"},{"name":"SidebarShell","sourcePath":"components/layout/SidebarShell.jsx"},{"name":"Stepper","sourcePath":"components/navigation/Stepper.jsx"}],"sourceHashes":{"components/cards/EventCard.jsx":"130f2bceb4b6","components/cards/TicketTierRow.jsx":"b0d419567073","components/display/Avatar.jsx":"06ecbad0b607","components/display/StatCard.jsx":"8a5d2f44557b","components/display/Tag.jsx":"228a6df2870e","components/feedback/Badge.jsx":"9f1fe9220498","components/feedback/EmptyState.jsx":"776d5da4e4a8","components/feedback/Toast.jsx":"3899e77f5acc","components/forms/Button.jsx":"d3e15fef0bb2","components/forms/Checkbox.jsx":"d105348df1a7","components/forms/FilterControl.jsx":"794c02f594e5","components/forms/Input.jsx":"853df301b1d8","components/forms/Radio.jsx":"ba2ed9fceaa1","components/forms/SearchBar.jsx":"1d484421b4c2","components/forms/Select.jsx":"13365bafb6a6","components/forms/Switch.jsx":"e48f477e4fdf","components/forms/Textarea.jsx":"de7c4f256f68","components/icons/Icon.jsx":"815cf298566e","components/layout/DataTable.jsx":"87f783ebe501","components/layout/Footer.jsx":"5e1e740465fe","components/layout/Modal.jsx":"0929b92b2515","components/layout/Navbar.jsx":"c953b3eb8d39","components/layout/SidebarShell.jsx":"a12b6bb13127","components/navigation/Stepper.jsx":"5ff0986967f6","ui_kits/admin-panel/AdminDashboard.jsx":"662a1764ef8c","ui_kits/admin-panel/AllEvents.jsx":"10419dba6f79","ui_kits/admin-panel/AllTransactions.jsx":"8ffdc3b40e30","ui_kits/admin-panel/Login.jsx":"6c6c23883954","ui_kits/admin-panel/ModerationQueue.jsx":"e76049518458","ui_kits/admin-panel/OrganiserManagement.jsx":"8d4f221c0064","ui_kits/admin-panel/PlatformSettings.jsx":"7d3b33d38e9e","ui_kits/admin-panel/RefundManagement.jsx":"8cb95333237b","ui_kits/organiser-portal/AttendeeList.jsx":"25cb85de2eb8","ui_kits/organiser-portal/Auth.jsx":"0a40c97be946","ui_kits/organiser-portal/CreateEvent.jsx":"51ae8d39a7f2","ui_kits/organiser-portal/EventCategories.jsx":"ca2a7ca04154","ui_kits/organiser-portal/EventDiscounts.jsx":"f430f35617d6","ui_kits/organiser-portal/EventOrders.jsx":"e1d8df4fd979","ui_kits/organiser-portal/EventRegistrationForm.jsx":"da25fcf23970","ui_kits/organiser-portal/EventTax.jsx":"7ed8c316b43f","ui_kits/organiser-portal/MyEvents.jsx":"513990253c87","ui_kits/organiser-portal/OrganiserDashboard.jsx":"f0f2b5426417","ui_kits/organiser-portal/OrganiserEventDetail.jsx":"b6e6294e1c1c","ui_kits/public-site/CategoryPage.jsx":"d052fbd65c41","ui_kits/public-site/Checkout.jsx":"db12bbd225c4","ui_kits/public-site/CityPage.jsx":"a7a4f308aefe","ui_kits/public-site/ErrorStates.jsx":"f8b65aaea887","ui_kits/public-site/EventDetail.jsx":"8845bc8d8589","ui_kits/public-site/EventListing.jsx":"d19c356bce46","ui_kits/public-site/Homepage.jsx":"2b85af60b5b5","ui_kits/public-site/OrderConfirmation.jsx":"d52f36b733cc"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.CyRokxDesignSystem_ef2ebf = window.CyRokxDesignSystem_ef2ebf || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/cards/TicketTierRow.jsx
try { (() => {
/** TicketTierRow — one ticket tier line in the buy panel: name, price, quantity stepper, availability. */
function TicketTierRow({
  name,
  price,
  description,
  available = true,
  remaining,
  quantity = 0,
  onQuantityChange,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      padding: '16px 0',
      borderBottom: '1px solid var(--border-default)',
      fontFamily: 'var(--font-sans)',
      opacity: available ? 1 : 0.5,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, name), description && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, description), remaining != null && available && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--color-warning)',
      marginTop: 4,
      fontWeight: 600
    }
  }, remaining, " left"), !available && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-subtle)',
      marginTop: 4,
      fontWeight: 600
    }
  }, "Sold out")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--color-accent)'
    }
  }, price), available && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-control)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onQuantityChange && onQuantityChange(Math.max(0, quantity - 1)),
    style: stepBtn
  }, "\u2212"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      textAlign: 'center',
      fontSize: 14,
      fontWeight: 600
    }
  }, quantity), /*#__PURE__*/React.createElement("button", {
    onClick: () => onQuantityChange && onQuantityChange(quantity + 1),
    style: stepBtn
  }, "+"))));
}
const stepBtn = {
  width: 30,
  height: 30,
  border: 'none',
  background: 'none',
  fontSize: 16,
  cursor: 'pointer',
  color: 'var(--text-heading)'
};
Object.assign(__ds_scope, { TicketTierRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/TicketTierRow.jsx", error: String((e && e.message) || e) }); }

// components/display/Avatar.jsx
try { (() => {
/** Avatar — organiser/user avatar, image or initials fallback. */
function Avatar({
  src,
  name = '',
  size = 40,
  style
}) {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  return src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      objectFit: 'cover',
      flex: 'none',
      ...style
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'var(--color-accent-tint)',
      color: 'var(--color-accent)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: size * 0.38,
      flex: 'none',
      ...style
    }
  }, initials || '?');
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/display/Tag.jsx
try { (() => {
/** Tag — category chip (Music, Comedy, Workshops…), neutral by default. */
function Tag({
  children,
  active = false,
  onClick,
  style
}) {
  const clickable = typeof onClick === 'function';
  return /*#__PURE__*/React.createElement("span", {
    onClick: onClick,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '6px 14px',
      borderRadius: 'var(--radius-pill)',
      fontSize: 13,
      fontWeight: 600,
      fontFamily: 'var(--font-sans)',
      background: active ? 'var(--color-accent-tint)' : 'var(--surface-card)',
      color: active ? 'var(--color-accent)' : 'var(--text-body)',
      border: `1px solid ${active ? 'var(--color-accent)' : 'var(--border-default)'}`,
      cursor: clickable ? 'pointer' : 'default',
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Badge.jsx
try { (() => {
const LOOK = {
  draft: {
    bg: 'var(--status-muted-bg)',
    fg: 'var(--status-muted-text)',
    label: 'Draft'
  },
  review: {
    bg: 'var(--status-warning-bg)',
    fg: 'var(--status-warning-text)',
    label: 'In review'
  },
  approved: {
    bg: 'var(--status-success-bg)',
    fg: 'var(--status-success-text)',
    label: 'Approved'
  },
  rejected: {
    bg: 'var(--status-error-bg)',
    fg: 'var(--status-error-text)',
    label: 'Rejected'
  },
  live: {
    bg: 'var(--status-success-bg)',
    fg: 'var(--status-success-text)',
    label: 'Live'
  },
  soldout: {
    bg: 'var(--status-muted-bg)',
    fg: 'var(--status-muted-text)',
    label: 'Sold out'
  }
};

/** Badge — status pill for event/order lifecycle (draft, in review, approved, rejected, live, sold out). */
function Badge({
  status = 'draft',
  children,
  style
}) {
  const look = LOOK[status] || LOOK.draft;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 'var(--radius-pill)',
      background: look.bg,
      color: look.fg,
      fontSize: 12,
      fontWeight: 600,
      fontFamily: 'var(--font-sans)',
      lineHeight: 1.4,
      ...style
    }
  }, children || look.label);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Badge.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
const SIZES = {
  sm: {
    padding: '6px 14px',
    fontSize: 14,
    gap: 6,
    height: 32
  },
  md: {
    padding: '10px 20px',
    fontSize: 16,
    gap: 8,
    height: 44
  },
  lg: {
    padding: '14px 28px',
    fontSize: 18,
    gap: 8,
    height: 52
  }
};
function look(variant, disabled, hover, active) {
  if (disabled) {
    return {
      background: 'var(--color-muted-bg)',
      color: 'var(--text-subtle)',
      border: '1px solid transparent'
    };
  }
  switch (variant) {
    case 'secondary':
      return {
        background: active ? 'var(--action-secondary-bg-hover)' : hover ? 'var(--action-secondary-bg-hover)' : 'transparent',
        color: 'var(--action-secondary-text)',
        border: '1px solid var(--action-secondary-border)'
      };
    case 'ghost':
      return {
        background: active ? 'var(--action-ghost-bg-hover)' : hover ? 'var(--action-ghost-bg-hover)' : 'transparent',
        color: 'var(--action-ghost-text)',
        border: '1px solid transparent'
      };
    case 'destructive':
      return {
        background: active ? 'var(--action-destructive-bg-hover)' : hover ? 'var(--action-destructive-bg-hover)' : 'var(--action-destructive-bg)',
        color: '#fff',
        border: '1px solid transparent'
      };
    default:
      return {
        background: active ? 'var(--action-primary-bg-active)' : hover ? 'var(--action-primary-bg-hover)' : 'var(--action-primary-bg)',
        color: 'var(--action-primary-text)',
        border: '1px solid transparent'
      };
  }
}

/** Button — primary/secondary/ghost/destructive action, three sizes, loading + disabled states. */
function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  children,
  onClick,
  type = 'button',
  style,
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const [focus, setFocus] = useState(false);
  const dim = SIZES[size] || SIZES.md;
  const colors = look(variant, disabled, hover, active);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled || loading,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--text-button-weight)',
      fontSize: dim.fontSize,
      padding: dim.padding,
      height: dim.height,
      borderRadius: 'var(--radius-control)',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: dim.gap,
      width: fullWidth ? '100%' : 'auto',
      flexShrink: 0,
      whiteSpace: 'nowrap',
      transition: 'background 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
      boxShadow: focus && !disabled ? 'var(--shadow-focus-ring)' : 'none',
      opacity: loading ? 0.75 : 1,
      ...colors,
      ...style
    }
  }, rest), loading && /*#__PURE__*/React.createElement("span", {
    style: {
      width: dim.fontSize,
      height: dim.fontSize,
      borderRadius: '50%',
      border: '2px solid currentColor',
      borderTopColor: 'transparent',
      display: 'inline-block',
      animation: 'cyrokx-spin 0.7s linear infinite'
    }
  }), /*#__PURE__*/React.createElement("style", null, '@keyframes cyrokx-spin{to{transform:rotate(360deg)}}'), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
/** Radio — single-choice radio button (payment method, ticket tier selection). */
function Radio({
  label,
  checked = false,
  onChange,
  disabled = false,
  name,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'var(--font-sans)',
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: name,
    checked: checked,
    onChange: onChange,
    disabled: disabled,
    style: {
      display: 'none'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      borderRadius: '50%',
      border: `1.5px solid ${checked ? 'var(--color-accent)' : 'var(--border-default)'}`,
      background: 'var(--surface-card)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none'
    }
  }, checked && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: 'var(--color-accent)'
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      color: 'var(--text-body)'
    }
  }, label));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
/** Switch — on/off toggle (notification preferences, check-in status). */
function Switch({
  checked = false,
  onChange,
  disabled = false,
  label,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'var(--font-sans)',
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: checked,
    onChange: onChange,
    disabled: disabled,
    style: {
      display: 'none'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 24,
      borderRadius: 'var(--radius-pill)',
      background: checked ? 'var(--color-accent)' : 'var(--color-rule)',
      position: 'relative',
      transition: 'background 0.15s ease',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 3,
      left: checked ? 19 : 3,
      width: 18,
      height: 18,
      borderRadius: '50%',
      background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      transition: 'left 0.15s ease'
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      color: 'var(--text-body)'
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/** Textarea — multi-line field for descriptions (event details, moderation reject reason). */
function Textarea({
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  rows = 4,
  style,
  ...rest
}) {
  const [focus, setFocus] = useState(false);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      fontFamily: 'var(--font-sans)',
      width: '100%',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 'var(--text-label-weight)',
      color: 'var(--text-heading)'
    }
  }, label), /*#__PURE__*/React.createElement("textarea", _extends({
    placeholder: placeholder,
    value: value,
    onChange: onChange,
    disabled: disabled,
    rows: rows,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: '100%',
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      padding: '11px 14px',
      borderRadius: 'var(--radius-control)',
      border: `1px solid ${error ? 'var(--color-error)' : focus ? 'var(--border-focus)' : 'var(--border-default)'}`,
      outline: 'none',
      resize: 'vertical',
      background: disabled ? 'var(--color-muted-bg)' : 'var(--surface-card)',
      color: 'var(--text-body)',
      boxShadow: focus && !error ? 'var(--shadow-focus-ring)' : 'none',
      boxSizing: 'border-box'
    }
  }, rest)), error && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--color-error)'
    }
  }, error));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/icons/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useEffect,
  useRef
} = React;
/**
 * Icon — thin wrapper around the Lucide icon set (loaded via CDN, see
 * assets/README or the Iconography section of the root readme). No SVG
 * path data lives in this repo; Lucide's runtime script draws the icon
 * into the <i> placeholder. Pages/cards that use <Icon> must load
 * https://unpkg.com/lucide@latest/dist/umd/lucide.js in <head>.
 */
function Icon({
  name,
  size = 18,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
  ...rest
}) {
  const ref = useRef(null);
  useEffect(() => {
    if (window.lucide && ref.current) {
      window.lucide.createIcons({
        nameAttr: 'data-lucide',
        attrs: {},
        icons: window.lucide.icons,
        context: ref.current.parentElement
      });
    }
  }, [name]);
  return /*#__PURE__*/React.createElement("i", _extends({
    ref: ref,
    "data-lucide": name,
    style: {
      width: size,
      height: size,
      display: 'inline-block',
      color,
      strokeWidth,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/Icon.jsx", error: String((e && e.message) || e) }); }

// components/cards/EventCard.jsx
try { (() => {
const {
  useState
} = React;
/** EventCard — the core discovery unit: image, title, date, city, price-from, category tag. Lifts on hover. */
function EventCard({
  image,
  title,
  date,
  city,
  priceFrom,
  category,
  soldOut = false,
  onClick,
  style
}) {
  const [hover, setHover] = useState(false);
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      borderRadius: 'var(--radius-card)',
      background: 'var(--surface-card)',
      overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default',
      boxShadow: hover ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
      transform: hover ? 'translateY(-3px)' : 'none',
      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      aspectRatio: '4/3',
      background: image ? `center/cover no-repeat url(${image})` : 'linear-gradient(135deg, #EFEAE4, #E4DED6)'
    }
  }, !image && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-subtle)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "image",
    size: 28
  })), category && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 12,
      left: 12
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Tag, {
    style: {
      background: 'rgba(255,255,255,0.92)',
      border: 'none'
    }
  }, category)), soldOut && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(13,13,13,0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontWeight: 700,
      fontSize: 14,
      letterSpacing: '0.04em'
    }
  }, "SOLD OUT")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginBottom: 6,
      lineHeight: 1.3
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 13,
      color: 'var(--text-muted)',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "calendar",
    size: 13
  }), " ", date, /*#__PURE__*/React.createElement("span", {
    style: {
      margin: '0 2px'
    }
  }, "\xB7"), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "map-pin",
    size: 13
  }), " ", city), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-subtle)'
    }
  }, "from ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-accent)',
      fontWeight: 700,
      fontSize: 16
    }
  }, priceFrom))));
}
Object.assign(__ds_scope, { EventCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/EventCard.jsx", error: String((e && e.message) || e) }); }

// components/display/StatCard.jsx
try { (() => {
/** StatCard — dashboard metric: label, value, optional delta (up/down). */
function StatCard({
  label,
  value,
  delta,
  icon,
  style
}) {
  const up = typeof delta === 'string' && delta.trim().startsWith('+');
  const down = typeof delta === 'string' && delta.trim().startsWith('-');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: 20,
      fontFamily: 'var(--font-sans)',
      minWidth: 180,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      fontWeight: 600
    }
  }, label), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16,
    color: "var(--text-subtle)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, value), delta && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      marginTop: 4,
      color: up ? 'var(--color-success)' : down ? 'var(--color-error)' : 'var(--text-muted)'
    }
  }, delta));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
/** EmptyState — icon, message, optional action; used for empty search results, empty tables. */
function EmptyState({
  icon = 'search',
  title,
  description,
  action,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '64px 24px',
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: '50%',
      background: 'var(--color-off-white)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 16px',
      color: 'var(--text-subtle)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 24
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginBottom: 6
    }
  }, title), description && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)',
      maxWidth: 340,
      margin: '0 auto 20px'
    }
  }, description), action);
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const LOOK = {
  success: {
    icon: 'check-circle',
    fg: 'var(--color-success)',
    bg: '#fff'
  },
  error: {
    icon: 'alert-circle',
    fg: 'var(--color-error)',
    bg: '#fff'
  },
  info: {
    icon: 'info',
    fg: 'var(--color-ink)',
    bg: '#fff'
  }
};

/** Toast — transient inline alert (success/error/info), fixed bottom-right in product shells. */
function Toast({
  variant = 'info',
  title,
  description,
  onClose,
  style
}) {
  const look = LOOK[variant] || LOOK.info;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
      background: look.bg,
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-modal)',
      padding: '14px 16px',
      width: 340,
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: look.fg,
      flex: 'none',
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: look.icon,
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text-heading)'
    }
  }, title), description && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, description)), onClose && /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--text-subtle)',
      padding: 2
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 16
  })));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
/** Checkbox — labeled checkbox with accent-filled checked state. */
function Checkbox({
  label,
  checked = false,
  onChange,
  disabled = false,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'var(--font-sans)',
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: checked,
    onChange: onChange,
    disabled: disabled,
    style: {
      display: 'none'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      borderRadius: 5,
      border: `1.5px solid ${checked ? 'var(--color-accent)' : 'var(--border-default)'}`,
      background: checked ? 'var(--color-accent)' : 'var(--surface-card)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none',
      transition: 'background 0.15s ease, border-color 0.15s ease'
    }
  }, checked && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 13,
    color: "#fff",
    strokeWidth: 3
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      color: 'var(--text-body)'
    }
  }, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/FilterControl.jsx
try { (() => {
/** FilterControl — the listing sidebar filter group: category/city/date/price, each expandable. */
function FilterControl({
  title,
  icon,
  children,
  defaultOpen = true
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderBottom: '1px solid var(--border-default)',
      padding: '16px 0',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(!open),
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 0,
      fontSize: 15,
      fontWeight: 600,
      color: 'var(--text-heading)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16,
    color: "var(--text-muted)"
  }), title), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: open ? 'chevron-down' : 'chevron-right',
    size: 16,
    color: "var(--text-subtle)"
  })), open && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, children));
}
Object.assign(__ds_scope, { FilterControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/FilterControl.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
/** Input — text/email/phone/number/search/date field with label, error and disabled states. */
function Input({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  icon,
  style,
  ...rest
}) {
  const [focus, setFocus] = useState(false);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      fontFamily: 'var(--font-sans)',
      width: '100%',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 'var(--text-label-weight)',
      color: 'var(--text-heading)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 12,
      display: 'flex',
      color: 'var(--text-subtle)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16
  })), /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    placeholder: placeholder,
    value: value,
    onChange: onChange,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: '100%',
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      padding: icon ? '11px 14px 11px 38px' : '11px 14px',
      borderRadius: 'var(--radius-control)',
      border: `1px solid ${error ? 'var(--color-error)' : focus ? 'var(--border-focus)' : 'var(--border-default)'}`,
      outline: 'none',
      background: disabled ? 'var(--color-muted-bg)' : 'var(--surface-card)',
      color: 'var(--text-body)',
      boxShadow: focus && !error ? 'var(--shadow-focus-ring)' : 'none',
      boxSizing: 'border-box',
      transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
    }
  }, rest))), error && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--color-error)'
    }
  }, error));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/SearchBar.jsx
try { (() => {
/** SearchBar — combined keyword + location search used in the homepage hero and nav. */
function SearchBar({
  keyword,
  onKeywordChange,
  location,
  onLocationChange,
  onSubmit,
  style
}) {
  return /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      onSubmit && onSubmit();
    },
    style: {
      display: 'flex',
      alignItems: 'center',
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-modal)',
      boxShadow: 'var(--shadow-card)',
      padding: 6,
      gap: 4,
      fontFamily: 'var(--font-sans)',
      maxWidth: 640,
      width: '100%',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 12px',
      flex: '0 0 160px',
      borderRight: '1px solid var(--border-default)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "map-pin",
    size: 16,
    color: "var(--text-subtle)"
  }), /*#__PURE__*/React.createElement("input", {
    value: location,
    onChange: onLocationChange,
    placeholder: "Any city",
    style: {
      border: 'none',
      outline: 'none',
      fontSize: 15,
      width: '100%',
      background: 'transparent',
      color: 'var(--text-body)'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 12px',
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 16,
    color: "var(--text-subtle)"
  }), /*#__PURE__*/React.createElement("input", {
    value: keyword,
    onChange: onKeywordChange,
    placeholder: "Search events, artists, venues",
    style: {
      border: 'none',
      outline: 'none',
      fontSize: 15,
      width: '100%',
      background: 'transparent',
      color: 'var(--text-body)'
    }
  })), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    style: {
      background: 'var(--action-primary-bg)',
      color: '#fff',
      border: 'none',
      borderRadius: 'var(--radius-control)',
      padding: '12px 24px',
      fontWeight: 600,
      fontSize: 15,
      cursor: 'pointer',
      flex: 'none'
    }
  }, "Search"));
}
Object.assign(__ds_scope, { SearchBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SearchBar.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
const {
  useState
} = React;
/** Select — single-choice dropdown (category, city, sort order). */
function Select({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  disabled = false,
  error,
  style
}) {
  const [focus, setFocus] = useState(false);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      fontFamily: 'var(--font-sans)',
      width: '100%',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 'var(--text-label-weight)',
      color: 'var(--text-heading)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: value,
    onChange: onChange,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: '100%',
      appearance: 'none',
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      padding: '11px 38px 11px 14px',
      borderRadius: 'var(--radius-control)',
      border: `1px solid ${error ? 'var(--color-error)' : focus ? 'var(--border-focus)' : 'var(--border-default)'}`,
      outline: 'none',
      background: disabled ? 'var(--color-muted-bg)' : 'var(--surface-card)',
      color: value ? 'var(--text-body)' : 'var(--text-subtle)',
      boxShadow: focus && !error ? 'var(--shadow-focus-ring)' : 'none',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true,
    hidden: true
  }, placeholder), options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value ?? o,
    value: o.value ?? o
  }, o.label ?? o))), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: 12,
      pointerEvents: 'none',
      color: 'var(--text-subtle)',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 16
  }))));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/layout/DataTable.jsx
try { (() => {
/** DataTable — generic table with optional row actions; backs attendee lists, transactions, organiser/admin tables. */
function DataTable({
  columns = [],
  rows = [],
  actions,
  emptyLabel = 'Nothing to show yet',
  style
}) {
  if (!rows.length) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 48,
        textAlign: 'center',
        color: 'var(--text-subtle)',
        fontFamily: 'var(--font-sans)',
        fontSize: 14
      }
    }, emptyLabel);
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: 'auto',
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    style: {
      textAlign: 'left',
      padding: '10px 16px',
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      color: 'var(--text-subtle)',
      fontWeight: 600,
      borderBottom: '1px solid var(--border-default)'
    }
  }, c.label)), actions && /*#__PURE__*/React.createElement("th", {
    style: {
      borderBottom: '1px solid var(--border-default)'
    }
  }))), /*#__PURE__*/React.createElement("tbody", null, rows.map((row, i) => /*#__PURE__*/React.createElement("tr", {
    key: row.id ?? i
  }, columns.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key,
    style: {
      padding: '14px 16px',
      borderBottom: '1px solid var(--border-default)',
      color: 'var(--text-body)'
    }
  }, c.render ? c.render(row) : row[c.key])), actions && /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '14px 16px',
      borderBottom: '1px solid var(--border-default)',
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--text-subtle)'
    },
    onClick: () => actions.onClick && actions.onClick(row)
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "more-horizontal",
    size: 18
  }))))))));
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/layout/Footer.jsx
try { (() => {
/** Footer — public site footer: brand blurb, link columns, legal line. */
function Footer({
  style
}) {
  const cols = [{
    title: 'Discover',
    links: ['Categories', 'Cities', 'Trending', 'For organisers']
  }, {
    title: 'Company',
    links: ['About', 'Careers', 'Press']
  }, {
    title: 'Support',
    links: ['Help centre', 'Contact us', 'Refund policy']
  }];
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--color-ink)',
      color: 'rgba(255,255,255,0.7)',
      fontFamily: 'var(--font-sans)',
      padding: '48px 32px 24px',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 64,
      marginBottom: 32,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 240
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      color: '#fff',
      marginBottom: 10
    }
  }, "CyRok", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-accent)'
    }
  }, "x")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      lineHeight: 1.6
    }
  }, "Discover and book live events near you \u2014 no account needed to buy a ticket.")), cols.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.title
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: '#fff',
      marginBottom: 12
    }
  }, c.title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, c.links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.65)',
      textDecoration: 'none'
    }
  }, l)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid rgba(255,255,255,0.12)',
      paddingTop: 16,
      fontSize: 12,
      color: 'rgba(255,255,255,0.45)'
    }
  }, "\xA9 2026 CyRokx. All rights reserved."));
}
Object.assign(__ds_scope, { Footer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Footer.jsx", error: String((e && e.message) || e) }); }

// components/layout/Modal.jsx
try { (() => {
/** Modal — shell for confirm/form/detail dialogs. Renders its own overlay; mount at the root. */
function Modal({
  open = true,
  title,
  children,
  footer,
  onClose,
  width = 480
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'var(--surface-overlay)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      fontFamily: 'var(--font-sans)'
    },
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width,
      maxWidth: '90vw',
      maxHeight: '85vh',
      overflow: 'auto',
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-modal)',
      boxShadow: 'var(--shadow-modal)',
      padding: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, title), onClose && /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--text-subtle)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 20
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-body)',
      fontSize: 15,
      lineHeight: 1.5
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 24
    }
  }, footer)));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Modal.jsx", error: String((e && e.message) || e) }); }

// components/layout/Navbar.jsx
try { (() => {
/** Navbar — public top navigation: wordmark, category links, city selector, search icon. */
function Navbar({
  categories = ['Music', 'Comedy', 'Workshops', 'Sports', 'Food'],
  city = 'Mumbai',
  onSearchClick,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 32px',
      background: 'var(--surface-card)',
      borderBottom: '1px solid var(--border-default)',
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: 'var(--text-heading)',
      letterSpacing: '-0.01em'
    }
  }, "CyRok", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-accent)'
    }
  }, "x")), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 24
    }
  }, categories.map(c => /*#__PURE__*/React.createElement("a", {
    key: c,
    href: "#",
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text-body)',
      textDecoration: 'none'
    }
  }, c)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text-body)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "map-pin",
    size: 15,
    color: "var(--text-muted)"
  }), " ", city, " ", /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 14,
    color: "var(--text-subtle)"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: onSearchClick,
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--text-heading)',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 19
  }))));
}
Object.assign(__ds_scope, { Navbar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Navbar.jsx", error: String((e && e.message) || e) }); }

// components/layout/SidebarShell.jsx
try { (() => {
/** SidebarShell — logged-in dashboard layout: left nav + content area. Shared by organiser and admin portals.
 *  accentColor lets a surface signal its own identity (e.g. the Super Admin Panel uses the secondary
 *  brand blue) while every primary action elsewhere still uses the one confident accent. */
function SidebarShell({
  brandLabel = 'CyRokx',
  navItems = [],
  activeKey,
  onNavigate,
  footer,
  accentColor = 'var(--color-accent)',
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      minHeight: '100%',
      fontFamily: 'var(--font-sans)',
      background: 'var(--surface-page)'
    }
  }, /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 232,
      background: 'var(--color-ink)',
      color: 'rgba(255,255,255,0.75)',
      display: 'flex',
      flexDirection: 'column',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '22px 24px',
      fontSize: 19,
      fontWeight: 700,
      color: '#fff'
    }
  }, brandLabel.replace(/x$/i, ''), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-accent)'
    }
  }, "x")), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      padding: '8px 12px',
      flex: 1
    }
  }, navItems.map(item => {
    const active = item.key === activeKey;
    return /*#__PURE__*/React.createElement("button", {
      key: item.key,
      onClick: () => onNavigate && onNavigate(item.key),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 8,
        border: 'none',
        background: active ? `color-mix(in srgb, ${accentColor} 16%, transparent)` : 'transparent',
        color: active ? '#fff' : 'rgba(255,255,255,0.65)',
        fontWeight: active ? 700 : 500,
        fontSize: 14,
        cursor: 'pointer',
        textAlign: 'left'
      }
    }, item.icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: item.icon,
      size: 17
    }), item.label);
  })), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      borderTop: '1px solid rgba(255,255,255,0.1)'
    }
  }, footer)), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      padding: 32,
      overflow: 'auto'
    }
  }, children));
}
Object.assign(__ds_scope, { SidebarShell });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/SidebarShell.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Stepper.jsx
try { (() => {
/** Stepper — multi-step progress indicator (event creation, checkout). */
function Stepper({
  steps = [],
  activeIndex = 0,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, steps.map((label, i) => {
    const done = i < activeIndex;
    const active = i === activeIndex;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: label
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 28,
        height: 28,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 700,
        flex: 'none',
        background: done ? 'var(--color-accent)' : active ? 'var(--color-accent-tint)' : 'var(--color-off-white)',
        color: done ? '#fff' : active ? 'var(--color-accent)' : 'var(--text-subtle)',
        border: active ? '1.5px solid var(--color-accent)' : '1.5px solid transparent'
      }
    }, done ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "check",
      size: 14,
      color: "#fff",
      strokeWidth: 3
    }) : i + 1), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: active ? 700 : 500,
        color: active || done ? 'var(--text-heading)' : 'var(--text-subtle)',
        whiteSpace: 'nowrap'
      }
    }, label)), i < steps.length - 1 && /*#__PURE__*/React.createElement("span", {
      style: {
        width: 32,
        height: 1,
        background: 'var(--border-default)',
        margin: '0 12px',
        flex: 'none'
      }
    }));
  }));
}
Object.assign(__ds_scope, { Stepper });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Stepper.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin-panel/AdminDashboard.jsx
try { (() => {
const {
  Icon,
  StatCard,
  Badge
} = window.CyRokxDesignSystem_ef2ebf;
const ACTIVITY = [{
  icon: 'clock',
  text: '3 new events entered the moderation queue',
  time: '8 min ago'
}, {
  icon: 'check-circle',
  text: 'Street Food Fest approved by Meera (admin)',
  time: '1 hour ago'
}, {
  icon: 'user-plus',
  text: 'New organiser verified — Terrace Live Events',
  time: '3 hours ago'
}, {
  icon: 'alert-circle',
  text: 'Indie Rock Live rejected — missing venue capacity',
  time: 'Yesterday'
}, {
  icon: 'credit-card',
  text: 'Refund issued for order #48213',
  time: 'Yesterday'
}];

/** Dashboard (admin) — platform-wide metrics and an activity feed. */
function AdminDashboard({
  onOpenQueue
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, "Platform overview"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)',
      marginTop: 4
    }
  }, "Across all organisers and cities.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: 16,
      marginBottom: 32
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Total events",
    value: "1,842",
    delta: "+34 this week",
    icon: "calendar"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Active events",
    value: "286",
    delta: "+12 this week",
    icon: "zap"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Tickets sold",
    value: "48.6K",
    delta: "+9% vs last week",
    icon: "ticket"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Revenue",
    value: "\u20B92.1Cr",
    delta: "+11% vs last week",
    icon: "indian-rupee"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "New organisers",
    value: "24",
    delta: "+6 this week",
    icon: "user-plus"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, "Awaiting moderation"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onOpenQueue && onOpenQueue();
    },
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-link)',
      textDecoration: 'none'
    }
  }, "Open queue \u2192")), [{
    title: 'Improv Comedy Jam',
    organiser: 'Laugh Lounge',
    status: 'review'
  }, {
    title: 'Marathon Expo',
    organiser: 'RunClub India',
    status: 'review'
  }, {
    title: 'Classical Evening',
    organiser: 'Raga Society',
    status: 'review'
  }].map((e, i, arr) => /*#__PURE__*/React.createElement("div", {
    key: e.title,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: i < arr.length - 1 ? '1px solid var(--border-default)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: 'var(--text-heading)'
    }
  }, e.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, e.organiser)), /*#__PURE__*/React.createElement(Badge, {
    status: e.status
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginBottom: 16
    }
  }, "Activity feed"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, ACTIVITY.map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: '50%',
      background: 'var(--color-off-white)',
      color: 'var(--text-muted)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: a.icon,
    size: 14
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--text-body)',
      lineHeight: 1.4
    }
  }, a.text), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-subtle)',
      marginTop: 2
    }
  }, a.time))))))));
}
window.AdminDashboard = AdminDashboard;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin-panel/AdminDashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin-panel/AllEvents.jsx
try { (() => {
const {
  Icon,
  Input,
  Badge,
  Button,
  DataTable,
  EmptyState
} = window.CyRokxDesignSystem_ef2ebf;
const ALL_EVENTS = [{
  title: 'Jazz Night at The Terrace',
  organiser: 'Terrace Live Events',
  city: 'Mumbai',
  status: 'live',
  registrations: 214
}, {
  title: 'Watercolour Workshop',
  organiser: 'Terrace Live Events',
  city: 'Bengaluru',
  status: 'live',
  registrations: 38
}, {
  title: 'Street Food Fest',
  organiser: 'Terrace Live Events',
  city: 'Mumbai',
  status: 'approved',
  registrations: 0
}, {
  title: 'Improv Comedy Jam',
  organiser: 'Laugh Lounge',
  city: 'Delhi',
  status: 'review',
  registrations: 0
}, {
  title: 'Marathon Expo',
  organiser: 'RunClub India',
  city: 'Mumbai',
  status: 'review',
  registrations: 0
}, {
  title: 'Classical Evening',
  organiser: 'Raga Society',
  city: 'Chennai',
  status: 'review',
  registrations: 0
}, {
  title: 'Indie Rock Live',
  organiser: 'Terrace Live Events',
  city: 'Pune',
  status: 'rejected',
  registrations: 0
}, {
  title: 'Summer Sold Out Fest',
  organiser: 'Foodie Collective',
  city: 'Mumbai',
  status: 'soldout',
  registrations: 1500
}];
const FILTERS = ['All', 'Live', 'In review', 'Approved', 'Rejected', 'Sold out'];
const FILTER_MAP = {
  All: null,
  Live: 'live',
  'In review': 'review',
  Approved: 'approved',
  Rejected: 'rejected',
  'Sold out': 'soldout'
};

/** AllEvents (admin) — full platform event list: status filters, search, deactivate action. */
function AllEvents() {
  const [filter, setFilter] = React.useState('All');
  const [query, setQuery] = React.useState('');
  const [deactivated, setDeactivated] = React.useState({});
  const rows = ALL_EVENTS.filter(e => {
    const matchesFilter = !FILTER_MAP[filter] || e.status === FILTER_MAP[filter];
    const matchesQuery = e.title.toLowerCase().includes(query.toLowerCase()) || e.organiser.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginBottom: 24
    }
  }, "All events"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, FILTERS.map(f => /*#__PURE__*/React.createElement("button", {
    key: f,
    onClick: () => setFilter(f),
    style: {
      padding: '7px 16px',
      borderRadius: 'var(--radius-pill)',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      border: `1px solid ${filter === f ? 'var(--color-accent)' : 'var(--border-default)'}`,
      background: filter === f ? 'var(--color-accent-tint)' : 'var(--surface-card)',
      color: filter === f ? 'var(--color-accent)' : 'var(--text-body)'
    }
  }, f))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 280
    }
  }, /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    placeholder: "Search events or organisers",
    value: query,
    onChange: e => setQuery(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)'
    }
  }, rows.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "calendar-x",
    title: "No events match",
    description: "Try a different filter or search term."
  }) : /*#__PURE__*/React.createElement(DataTable, {
    columns: [{
      key: 'title',
      label: 'Event',
      render: r => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        style: {
          fontWeight: 700,
          color: 'var(--text-heading)'
        }
      }, r.title), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12.5,
          color: 'var(--text-muted)',
          marginTop: 2
        }
      }, r.city))
    }, {
      key: 'organiser',
      label: 'Organiser'
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.status
      })
    }, {
      key: 'registrations',
      label: 'Registrations'
    }, {
      key: 'action',
      label: '',
      render: r => deactivated[r.title] ? /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 13,
          color: 'var(--text-subtle)',
          fontWeight: 600
        }
      }, "Deactivated") : /*#__PURE__*/React.createElement(Button, {
        variant: "destructive",
        size: "sm",
        onClick: () => setDeactivated(d => ({
          ...d,
          [r.title]: true
        }))
      }, "Deactivate")
    }],
    rows: rows
  })));
}
window.AllEvents = AllEvents;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin-panel/AllEvents.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin-panel/AllTransactions.jsx
try { (() => {
const {
  Icon,
  Input,
  Select,
  Badge,
  Button,
  DataTable,
  EmptyState
} = window.CyRokxDesignSystem_ef2ebf;
const TRANSACTIONS = [{
  id: '#48213',
  event: 'Jazz Night at The Terrace',
  organiser: 'Terrace Live Events',
  buyer: 'Priya Sharma',
  amount: '₹1,499',
  status: 'success',
  date: '2 Jul'
}, {
  id: '#48212',
  event: 'Watercolour Workshop',
  organiser: 'Terrace Live Events',
  buyer: 'Rohan Mehta',
  amount: '₹1,200',
  status: 'success',
  date: '2 Jul'
}, {
  id: '#48211',
  event: 'Indie Rock Live',
  organiser: 'Terrace Live Events',
  buyer: 'Ananya Iyer',
  amount: '₹599',
  status: 'refunded',
  date: '1 Jul'
}, {
  id: '#48210',
  event: 'Street Food Fest',
  organiser: 'Foodie Collective',
  buyer: 'Karan Verma',
  amount: '₹299',
  status: 'failed',
  date: '1 Jul'
}, {
  id: '#48209',
  event: 'Marathon Expo',
  organiser: 'RunClub India',
  buyer: 'Neha Kapoor',
  amount: '₹0',
  status: 'success',
  date: '30 Jun'
}, {
  id: '#48208',
  event: 'Classical Evening',
  organiser: 'Raga Society',
  buyer: 'Vivaan Shah',
  amount: '₹899',
  status: 'success',
  date: '30 Jun'
}];
const TRANSACTION_STATUS_LOOK = {
  success: {
    bg: 'var(--status-success-bg)',
    fg: 'var(--status-success-text)',
    label: 'Success'
  },
  refunded: {
    bg: 'var(--status-muted-bg)',
    fg: 'var(--status-muted-text)',
    label: 'Refunded'
  },
  failed: {
    bg: 'var(--status-error-bg)',
    fg: 'var(--status-error-text)',
    label: 'Failed'
  }
};
function TransactionStatusPill({
  status
}) {
  const l = TRANSACTION_STATUS_LOOK[status];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      padding: '4px 10px',
      borderRadius: 'var(--radius-pill)',
      background: l.bg,
      color: l.fg,
      fontSize: 12,
      fontWeight: 600
    }
  }, l.label);
}

/** AllTransactions — payment records across the platform: filter by event/organiser, export. */
function AllTransactions() {
  const [eventFilter, setEventFilter] = React.useState('');
  const [organiserFilter, setOrganiserFilter] = React.useState('');
  const events = [...new Set(TRANSACTIONS.map(t => t.event))];
  const organisers = [...new Set(TRANSACTIONS.map(t => t.organiser))];
  const rows = TRANSACTIONS.filter(t => (!eventFilter || t.event === eventFilter) && (!organiserFilter || t.organiser === organiserFilter));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, "All transactions"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "download",
    size: 15
  }), "Export")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 240
    }
  }, /*#__PURE__*/React.createElement(Select, {
    placeholder: "All events",
    value: eventFilter,
    onChange: e => setEventFilter(e.target.value),
    options: events
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 240
    }
  }, /*#__PURE__*/React.createElement(Select, {
    placeholder: "All organisers",
    value: organiserFilter,
    onChange: e => setOrganiserFilter(e.target.value),
    options: organisers
  })), (eventFilter || organiserFilter) && /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    onClick: () => {
      setEventFilter('');
      setOrganiserFilter('');
    }
  }, "Clear filters")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)'
    }
  }, rows.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "receipt",
    title: "No transactions match",
    description: "Try clearing your filters."
  }) : /*#__PURE__*/React.createElement(DataTable, {
    columns: [{
      key: 'id',
      label: 'Transaction'
    }, {
      key: 'event',
      label: 'Event',
      render: r => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        style: {
          fontWeight: 600,
          color: 'var(--text-heading)'
        }
      }, r.event), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12.5,
          color: 'var(--text-muted)'
        }
      }, r.organiser))
    }, {
      key: 'buyer',
      label: 'Buyer'
    }, {
      key: 'amount',
      label: 'Amount',
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          fontWeight: 700,
          color: 'var(--text-heading)'
        }
      }, r.amount)
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(TransactionStatusPill, {
        status: r.status
      })
    }, {
      key: 'date',
      label: 'Date'
    }],
    rows: rows
  })));
}
window.AllTransactions = AllTransactions;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin-panel/AllTransactions.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin-panel/Login.jsx
try { (() => {
const {
  Icon,
  Input,
  Button
} = window.CyRokxDesignSystem_ef2ebf;

/** Login — super admin sign-in. Single account, no self-registration. */
function AdminLogin({
  onSubmit
}) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: 'var(--color-ink)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 400,
      maxWidth: '100%',
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-modal)',
      padding: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, "CyRok", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-accent)'
    }
  }, "x")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield",
    size: 13
  }), " Super admin")), /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      onSubmit && onSubmit();
    },
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Email",
    type: "email",
    placeholder: "admin@cyrokx.com",
    value: email,
    onChange: e => setEmail(e.target.value)
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Password",
    type: "password",
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    value: password,
    onChange: e => setPassword(e.target.value)
  }), /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    fullWidth: true,
    size: "lg"
  }, "Log in")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      fontSize: 12.5,
      color: 'var(--text-subtle)',
      marginTop: 20
    }
  }, "Access is provisioned by the platform team \u2014 no self-registration.")));
}
window.AdminLogin = AdminLogin;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin-panel/Login.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin-panel/ModerationQueue.jsx
try { (() => {
const {
  Icon,
  Badge,
  Button,
  Textarea,
  EmptyState
} = window.CyRokxDesignSystem_ef2ebf;
const QUEUE = [{
  id: 'e1',
  title: 'Improv Comedy Jam',
  organiser: 'Laugh Lounge',
  submitted: '2 hours ago',
  category: 'Comedy',
  date: 'Sat, 19 Jul, 8:00 PM',
  venue: 'The Backyard, Delhi',
  capacity: 120,
  description: 'A fast-paced improv comedy showcase featuring six performers, audience prompts, and a house band. Doors at 7:30, show runs 90 minutes.'
}, {
  id: 'e2',
  title: 'Marathon Expo',
  organiser: 'RunClub India',
  submitted: '5 hours ago',
  category: 'Sports',
  date: 'Sun, 20 Jul, 9:00 AM',
  venue: 'Marine Drive, Mumbai',
  capacity: 2000,
  description: 'Expo and bib collection for the city marathon — gear stalls, nutrition talks, and a free fun run for kids.'
}, {
  id: 'e3',
  title: 'Classical Evening',
  organiser: 'Raga Society',
  submitted: 'Yesterday',
  category: 'Music',
  date: 'Fri, 25 Jul, 7:00 PM',
  venue: 'Ravindra Bhavan, Chennai',
  capacity: 300,
  description: 'An evening of Carnatic vocal and violin, presented by three senior artists from the Raga Society repertory.'
}, {
  id: 'e4',
  title: 'Street Food Fest — Round 2',
  organiser: 'Foodie Collective',
  submitted: 'Yesterday',
  category: 'Food & Drink',
  date: 'Sat, 26 Jul, 12:00 PM',
  venue: 'Carter Road, Mumbai',
  capacity: 500,
  description: '40 vendor stalls, live cooking demos, and a ticketed tasting trail across the promenade.'
}];

/** ModerationQueue — events awaiting review + a review panel to approve or reject with a reason. Fast, scannable triage. */
function ModerationQueue() {
  const [items, setItems] = React.useState(QUEUE);
  const [selectedId, setSelectedId] = React.useState(QUEUE[0].id);
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [resolved, setResolved] = React.useState({}); // id -> 'approved' | 'rejected'

  const selected = items.find(e => e.id === selectedId);
  const decide = (id, decision) => {
    setResolved(r => ({
      ...r,
      [id]: decision
    }));
    setRejecting(false);
    setReason('');
    const remaining = items.filter(e => e.id !== id && !resolved[e.id]);
    if (remaining[0]) setSelectedId(remaining[0].id);
  };
  const pending = items.filter(e => !resolved[e.id]);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, "Moderation queue"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)',
      marginTop: 4
    }
  }, pending.length, " events awaiting review")), pending.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)'
    }
  }, /*#__PURE__*/React.createElement(EmptyState, {
    icon: "check-circle",
    title: "Queue clear",
    description: "Every submitted event has been reviewed."
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '360px 1fr',
      gap: 20,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, items.filter(e => !resolved[e.id]).map(e => {
    const active = e.id === selectedId;
    return /*#__PURE__*/React.createElement("div", {
      key: e.id,
      onClick: () => {
        setSelectedId(e.id);
        setRejecting(false);
        setReason('');
      },
      style: {
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-card)',
        padding: 16,
        cursor: 'pointer',
        boxShadow: active ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
        border: `1.5px solid ${active ? 'var(--color-accent)' : 'transparent'}`
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 700,
        color: 'var(--text-heading)'
      }
    }, e.title), /*#__PURE__*/React.createElement(Badge, {
      status: "review"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: 'var(--text-muted)'
      }
    }, e.organiser), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--text-subtle)',
        marginTop: 6
      }
    }, "Submitted ", e.submitted));
  })), selected && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginBottom: 6
    }
  }, selected.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "building-2",
    size: 14
  }), " ", selected.organiser)), /*#__PURE__*/React.createElement(Badge, {
    status: "review"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '16/5',
      borderRadius: 'var(--radius-control)',
      background: 'linear-gradient(135deg, #EFEAE4, #E4DED6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-subtle)',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "image",
    size: 26
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(ModerationDetailRow, {
    icon: "tag",
    label: "Category",
    value: selected.category
  }), /*#__PURE__*/React.createElement(ModerationDetailRow, {
    icon: "calendar",
    label: "Date",
    value: selected.date
  }), /*#__PURE__*/React.createElement(ModerationDetailRow, {
    icon: "map-pin",
    label: "Venue",
    value: selected.venue
  }), /*#__PURE__*/React.createElement(ModerationDetailRow, {
    icon: "users",
    label: "Capacity",
    value: selected.capacity.toLocaleString()
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-heading)',
      marginBottom: 6
    }
  }, "Description"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-body)',
      lineHeight: 1.5,
      marginBottom: 24
    }
  }, selected.description), rejecting ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Textarea, {
    label: "Reason for rejection",
    placeholder: "Tell the organiser what needs to change\u2026",
    rows: 3,
    value: reason,
    onChange: e => setReason(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginTop: 16,
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    onClick: () => {
      setRejecting(false);
      setReason('');
    }
  }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
    variant: "destructive",
    disabled: !reason.trim(),
    onClick: () => decide(selected.id, 'rejected')
  }, "Confirm rejection"))) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      justifyContent: 'flex-end',
      paddingTop: 20,
      borderTop: '1px solid var(--border-default)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "destructive",
    onClick: () => setRejecting(true)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 15
  }), "Reject"), /*#__PURE__*/React.createElement(Button, {
    onClick: () => decide(selected.id, 'approved')
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 15
  }), "Approve")))));
}
function ModerationDetailRow({
  icon,
  label,
  value
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-subtle)',
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 15
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-subtle)',
      fontWeight: 600
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-heading)',
      fontWeight: 600
    }
  }, value)));
}
window.ModerationQueue = ModerationQueue;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin-panel/ModerationQueue.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin-panel/OrganiserManagement.jsx
try { (() => {
const {
  Icon,
  Input,
  Avatar,
  Badge,
  Button,
  DataTable,
  Modal,
  EmptyState
} = window.CyRokxDesignSystem_ef2ebf;
const ORGANISERS = [{
  name: 'Terrace Live Events',
  contact: 'Aditi Rao',
  email: 'aditi@terracelive.in',
  status: 'verified',
  events: 4,
  history: ['Signed up 12 Mar 2026', 'Verified 14 Mar 2026', '4 events submitted, 3 approved, 1 rejected']
}, {
  name: 'Laugh Lounge',
  contact: 'Kabir Singh',
  email: 'kabir@laughlounge.in',
  status: 'pending',
  events: 1,
  history: ['Signed up 28 Jun 2026', 'Awaiting verification']
}, {
  name: 'RunClub India',
  contact: 'Meher Chawla',
  email: 'meher@runclub.in',
  status: 'verified',
  events: 6,
  history: ['Signed up 2 Jan 2026', 'Verified 4 Jan 2026', '6 events submitted, all approved']
}, {
  name: 'Raga Society',
  contact: 'Srinivasan K.',
  email: 'srini@ragasociety.org',
  status: 'verified',
  events: 2,
  history: ['Signed up 19 Feb 2026', 'Verified 21 Feb 2026', '2 events submitted, 1 pending review']
}, {
  name: 'Foodie Collective',
  contact: 'Zara Khan',
  email: 'zara@foodiecollective.in',
  status: 'suspended',
  events: 3,
  history: ['Signed up 5 Nov 2025', 'Verified 8 Nov 2025', 'Suspended 30 Jun 2026 — repeated payout disputes']
}];
const ORGANISER_STATUS_LOOK = {
  verified: {
    bg: 'var(--status-success-bg)',
    fg: 'var(--status-success-text)',
    label: 'Verified'
  },
  pending: {
    bg: 'var(--status-warning-bg)',
    fg: 'var(--status-warning-text)',
    label: 'Pending'
  },
  suspended: {
    bg: 'var(--status-error-bg)',
    fg: 'var(--status-error-text)',
    label: 'Suspended'
  }
};
function OrganiserStatusPill({
  status
}) {
  const l = ORGANISER_STATUS_LOOK[status];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      padding: '4px 10px',
      borderRadius: 'var(--radius-pill)',
      background: l.bg,
      color: l.fg,
      fontSize: 12,
      fontWeight: 600
    }
  }, l.label);
}

/** OrganiserManagement — table of organisers: verify, suspend, view history. */
function OrganiserManagement() {
  const [query, setQuery] = React.useState('');
  const [organisers, setOrganisers] = React.useState(ORGANISERS);
  const [historyFor, setHistoryFor] = React.useState(null);
  const setStatus = (name, status) => setOrganisers(list => list.map(o => o.name === name ? {
    ...o,
    status
  } : o));
  const rows = organisers.filter(o => o.name.toLowerCase().includes(query.toLowerCase()) || o.contact.toLowerCase().includes(query.toLowerCase()));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, "Organiser management"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 260
    }
  }, /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    placeholder: "Search organisers",
    value: query,
    onChange: e => setQuery(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)'
    }
  }, rows.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "user-x",
    title: "No organisers match",
    description: "Try a different search term."
  }) : /*#__PURE__*/React.createElement(DataTable, {
    columns: [{
      key: 'name',
      label: 'Organiser',
      render: r => /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }
      }, /*#__PURE__*/React.createElement(Avatar, {
        name: r.contact,
        size: 34
      }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        style: {
          fontWeight: 700,
          color: 'var(--text-heading)'
        }
      }, r.name), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12.5,
          color: 'var(--text-muted)'
        }
      }, r.contact, " \xB7 ", r.email)))
    }, {
      key: 'events',
      label: 'Events'
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(OrganiserStatusPill, {
        status: r.status
      })
    }, {
      key: 'actions',
      label: '',
      render: r => /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          gap: 8,
          justifyContent: 'flex-end'
        }
      }, /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        size: "sm",
        onClick: () => setHistoryFor(r)
      }, "History"), r.status === 'pending' && /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        onClick: () => setStatus(r.name, 'verified')
      }, "Verify"), r.status === 'verified' && /*#__PURE__*/React.createElement(Button, {
        variant: "destructive",
        size: "sm",
        onClick: () => setStatus(r.name, 'suspended')
      }, "Suspend"), r.status === 'suspended' && /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        size: "sm",
        onClick: () => setStatus(r.name, 'verified')
      }, "Reinstate"))
    }],
    rows: rows
  })), historyFor && /*#__PURE__*/React.createElement(Modal, {
    title: historyFor.name,
    onClose: () => setHistoryFor(null),
    width: 440
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, historyFor.history.map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "dot",
    size: 16,
    color: "var(--text-subtle)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--text-body)'
    }
  }, h))))));
}
window.OrganiserManagement = OrganiserManagement;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin-panel/OrganiserManagement.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin-panel/PlatformSettings.jsx
try { (() => {
const {
  Icon,
  Input,
  Button,
  Switch,
  Tag,
  Textarea
} = window.CyRokxDesignSystem_ef2ebf;
const DEFAULT_CATEGORIES = ['Music', 'Comedy', 'Workshops', 'Sports', 'Food & Drink', 'Theatre'];
function PlatformSettingsCard({
  icon,
  title,
  description,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: 24,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
      background: 'var(--color-accent-tint)',
      color: 'var(--color-accent)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 17
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, description))), children);
}

/** PlatformSettings — category management, commission config, and email-notification settings with a live preview. */
function PlatformSettings() {
  const [categories, setCategories] = React.useState(DEFAULT_CATEGORIES);
  const [newCategory, setNewCategory] = React.useState('');
  const [commission, setCommission] = React.useState('8');
  const [buyerFee, setBuyerFee] = React.useState(true);
  const [autoPayout, setAutoPayout] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const addCategory = () => {
    const v = newCategory.trim();
    if (v && !categories.includes(v)) setCategories([...categories, v]);
    setNewCategory('');
  };
  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, "Platform settings"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)',
      marginTop: 4
    }
  }, "Categories, commission, and buyer notifications \u2014 platform-wide.")), /*#__PURE__*/React.createElement(Button, {
    onClick: save
  }, saved ? 'Saved' : 'Save changes')), /*#__PURE__*/React.createElement(PlatformSettingsCard, {
    icon: "tag",
    title: "Categories",
    description: "Shown on the homepage grid and used as filters across the site."
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16
    }
  }, categories.map(c => /*#__PURE__*/React.createElement("span", {
    key: c,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 8px 6px 14px',
      borderRadius: 999,
      background: 'var(--color-off-white)',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-body)'
    }
  }, c, /*#__PURE__*/React.createElement("span", {
    onClick: () => setCategories(categories.filter(x => x !== c)),
    style: {
      display: 'flex',
      cursor: 'pointer',
      color: 'var(--text-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 13
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      maxWidth: 360
    }
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Add a category",
    value: newCategory,
    onChange: e => setNewCategory(e.target.value)
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: addCategory
  }, "Add"))), /*#__PURE__*/React.createElement(PlatformSettingsCard, {
    icon: "percent",
    title: "Commission",
    description: "Platform fee taken from every ticket sold, before organiser payout."
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24,
      alignItems: 'flex-end',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 160
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Platform commission",
    value: commission,
    onChange: e => setCommission(e.target.value.replace(/[^0-9]/g, '')),
    icon: "percent"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      paddingBottom: 12
    }
  }, "On a \u20B91,000 ticket, CyRokx keeps ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--text-heading)'
    }
  }, "\u20B9", Math.round((Number(commission) || 0) * 10)), ".")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      marginTop: 20,
      paddingTop: 20,
      borderTop: '1px solid var(--border-default)'
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    label: "Pass a separate booking fee to the buyer",
    checked: buyerFee,
    onChange: e => setBuyerFee(e.target.checked)
  }), /*#__PURE__*/React.createElement(Switch, {
    label: "Release payouts automatically once an event is approved",
    checked: autoPayout,
    onChange: e => setAutoPayout(e.target.checked)
  }))), /*#__PURE__*/React.createElement(PlatformSettingsCard, {
    icon: "mail",
    title: "Buyer email notifications",
    description: "Sender identity and footer for order-confirmation email."
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Sender name",
    defaultValue: "CyRokx",
    placeholder: "CyRokx"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Reply-to email",
    type: "email",
    placeholder: "support@cyrokx.com"
  }), /*#__PURE__*/React.createElement(Textarea, {
    label: "Footer note",
    rows: 2,
    placeholder: "Questions about your order? Reply to this email."
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--text-subtle)',
      marginBottom: 8
    }
  }, "PREVIEW"), /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-control)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--color-ink)',
      color: '#fff',
      padding: '16px 20px',
      fontWeight: 700,
      fontSize: 15
    }
  }, "CyRok", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-accent)'
    }
  }, "x")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      marginBottom: 12
    }
  }, "You're going! Order #CX-48213 confirmed."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: 14,
      color: 'var(--text-heading)',
      marginBottom: 4
    }
  }, "Jazz Night at The Terrace"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--text-muted)',
      marginBottom: 14
    }
  }, "Sat, 12 Jul \xB7 7:00 PM \xB7 The Terrace, Bandra, Mumbai"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: 8,
      background: 'var(--color-off-white)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-subtle)',
      margin: '0 auto 14px'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "qr-code",
    size: 28
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--text-subtle)',
      textAlign: 'center'
    }
  }, "Questions about your order? Reply to this email.")))))));
}
window.PlatformSettings = PlatformSettings;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin-panel/PlatformSettings.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin-panel/RefundManagement.jsx
try { (() => {
const {
  Icon,
  Badge,
  Button,
  DataTable,
  EmptyState,
  Modal,
  Textarea
} = window.CyRokxDesignSystem_ef2ebf;
const REQUESTS = [{
  id: '#48211',
  event: 'Indie Rock Live',
  buyer: 'Ananya Iyer',
  amount: '₹599',
  reason: 'Event rescheduled, buyer unavailable',
  requested: '1 Jul',
  status: 'pending'
}, {
  id: '#48198',
  event: 'Watercolour Workshop',
  buyer: 'Rohan Mehta',
  amount: '₹1,200',
  reason: 'Duplicate booking made by mistake',
  requested: '30 Jun',
  status: 'pending'
}, {
  id: '#48180',
  event: 'Street Food Fest',
  buyer: 'Karan Verma',
  amount: '₹299',
  reason: 'Payment charged twice',
  requested: '28 Jun',
  status: 'approved'
}, {
  id: '#48166',
  event: 'Jazz Night at The Terrace',
  buyer: 'Diya Kulkarni',
  amount: '₹799',
  reason: 'Changed mind, requested outside policy window',
  requested: '26 Jun',
  status: 'rejected'
}];
const DISPUTES = [{
  id: '#48180',
  event: 'Street Food Fest',
  buyer: 'Karan Verma',
  outcome: 'Refunded in full',
  resolvedBy: 'Meera Nair',
  date: '29 Jun'
}, {
  id: '#48102',
  event: 'Marathon Expo',
  buyer: 'Ishaan Bhatt',
  outcome: 'Refund denied — policy window passed',
  resolvedBy: 'Meera Nair',
  date: '18 Jun'
}];
const REFUND_STATUS_LOOK = {
  pending: 'review',
  approved: 'approved',
  rejected: 'rejected'
};

/** RefundManagement — initiate or reject buyer refund requests, plus a read-only dispute resolution log. */
function RefundManagement() {
  const [tab, setTab] = React.useState('requests');
  const [requests, setRequests] = React.useState(REQUESTS);
  const [active, setActive] = React.useState(null); // request being reviewed
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const pending = requests.filter(r => r.status === 'pending');
  const decide = (id, status) => {
    setRequests(rs => rs.map(r => r.id === id ? {
      ...r,
      status
    } : r));
    setActive(null);
    setRejecting(false);
    setReason('');
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, "Refund management"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)',
      marginTop: 4
    }
  }, pending.length, " refund requests awaiting a decision")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginBottom: 20
    }
  }, [{
    key: 'requests',
    label: 'Refund requests'
  }, {
    key: 'disputes',
    label: 'Dispute log'
  }].map(t => /*#__PURE__*/React.createElement("button", {
    key: t.key,
    onClick: () => setTab(t.key),
    style: {
      padding: '8px 16px',
      borderRadius: 999,
      fontSize: 13,
      fontWeight: 600,
      fontFamily: 'var(--font-sans)',
      cursor: 'pointer',
      border: tab === t.key ? 'none' : '1px solid var(--border-default)',
      background: tab === t.key ? 'var(--color-accent)' : 'var(--surface-card)',
      color: tab === t.key ? '#fff' : 'var(--text-body)'
    }
  }, t.label))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)'
    }
  }, tab === 'requests' && (requests.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "rotate-ccw",
    title: "No refund requests",
    description: "Buyer-initiated refund requests will show up here."
  }) : /*#__PURE__*/React.createElement(DataTable, {
    columns: [{
      key: 'id',
      label: 'Order'
    }, {
      key: 'event',
      label: 'Event',
      render: r => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        style: {
          fontWeight: 600,
          color: 'var(--text-heading)'
        }
      }, r.event), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12.5,
          color: 'var(--text-muted)'
        }
      }, r.buyer))
    }, {
      key: 'amount',
      label: 'Amount',
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          fontWeight: 700,
          color: 'var(--text-heading)'
        }
      }, r.amount)
    }, {
      key: 'reason',
      label: 'Reason given'
    }, {
      key: 'requested',
      label: 'Requested'
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: REFUND_STATUS_LOOK[r.status]
      }, r.status === 'pending' ? 'Pending' : r.status === 'approved' ? 'Refunded' : 'Rejected')
    }, {
      key: 'actions',
      label: '',
      render: r => r.status === 'pending' ? /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        variant: "secondary",
        onClick: () => {
          setActive(r);
          setRejecting(false);
          setReason('');
        }
      }, "Review") : null
    }],
    rows: requests
  })), tab === 'disputes' && /*#__PURE__*/React.createElement(DataTable, {
    columns: [{
      key: 'id',
      label: 'Order'
    }, {
      key: 'event',
      label: 'Event',
      render: r => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        style: {
          fontWeight: 600,
          color: 'var(--text-heading)'
        }
      }, r.event), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12.5,
          color: 'var(--text-muted)'
        }
      }, r.buyer))
    }, {
      key: 'outcome',
      label: 'Outcome'
    }, {
      key: 'resolvedBy',
      label: 'Resolved by'
    }, {
      key: 'date',
      label: 'Date'
    }],
    rows: DISPUTES
  })), active && /*#__PURE__*/React.createElement(Modal, {
    title: `Refund request — ${active.id}`,
    open: !!active,
    onClose: () => {
      setActive(null);
      setRejecting(false);
      setReason('');
    },
    width: 480,
    footer: rejecting ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: () => setRejecting(false)
    }, "Back"), /*#__PURE__*/React.createElement(Button, {
      variant: "destructive",
      disabled: !reason.trim(),
      onClick: () => decide(active.id, 'rejected')
    }, "Confirm rejection")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "destructive",
      onClick: () => setRejecting(true)
    }, "Reject"), /*#__PURE__*/React.createElement(Button, {
      onClick: () => decide(active.id, 'approved')
    }, "Approve refund"))
  }, rejecting ? /*#__PURE__*/React.createElement(Textarea, {
    label: "Reason for rejection",
    placeholder: "Tell the buyer why this refund isn't approved\u2026",
    rows: 3,
    value: reason,
    onChange: e => setReason(e.target.value)
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement(RefundDetailRow, {
    label: "Event",
    value: active.event
  }), /*#__PURE__*/React.createElement(RefundDetailRow, {
    label: "Buyer",
    value: active.buyer
  }), /*#__PURE__*/React.createElement(RefundDetailRow, {
    label: "Amount",
    value: active.amount
  }), /*#__PURE__*/React.createElement(RefundDetailRow, {
    label: "Reason given",
    value: active.reason
  }), /*#__PURE__*/React.createElement(RefundDetailRow, {
    label: "Requested",
    value: active.requested
  }))));
}
function RefundDetailRow({
  label,
  value
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 16,
      paddingBottom: 10,
      borderBottom: '1px solid var(--border-default)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-heading)',
      fontWeight: 600,
      textAlign: 'right'
    }
  }, value));
}
window.RefundManagement = RefundManagement;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin-panel/RefundManagement.jsx", error: String((e && e.message) || e) }); }

// ui_kits/organiser-portal/AttendeeList.jsx
try { (() => {
const {
  Icon,
  Input,
  Button,
  EmptyState
} = window.CyRokxDesignSystem_ef2ebf;
const ATTENDEES = [{
  name: 'Priya Sharma',
  email: 'priya.s@example.com',
  tier: 'VIP',
  purchased: '2 Jul, 4:12pm',
  checkedIn: true
}, {
  name: 'Rohan Mehta',
  email: 'rohan.m@example.com',
  tier: 'Standard',
  purchased: '2 Jul, 3:58pm',
  checkedIn: true
}, {
  name: 'Ananya Iyer',
  email: 'ananya.i@example.com',
  tier: 'Standard',
  purchased: '2 Jul, 2:30pm',
  checkedIn: false
}, {
  name: 'Karan Verma',
  email: 'karan.v@example.com',
  tier: 'Early Bird',
  purchased: '1 Jul, 6:14pm',
  checkedIn: true
}, {
  name: 'Neha Kapoor',
  email: 'neha.k@example.com',
  tier: 'Standard',
  purchased: '1 Jul, 5:02pm',
  checkedIn: false
}, {
  name: 'Vivaan Shah',
  email: 'vivaan.s@example.com',
  tier: 'VIP',
  purchased: '30 Jun, 11:45am',
  checkedIn: false
}];

/** AttendeeList — organiser's attendee table for one event: search, CSV export, manual check-in toggle. */
function AttendeeList({
  onBack,
  embedded
}) {
  const [query, setQuery] = React.useState('');
  const [attendees, setAttendees] = React.useState(ATTENDEES);
  const rows = attendees.filter(a => a.name.toLowerCase().includes(query.toLowerCase()) || a.email.toLowerCase().includes(query.toLowerCase()));
  const toggle = email => setAttendees(list => list.map(a => a.email === email ? {
    ...a,
    checkedIn: !a.checkedIn
  } : a));
  return /*#__PURE__*/React.createElement("div", null, !embedded && /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      background: 'none',
      border: 'none',
      color: 'var(--text-muted)',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      marginBottom: 16,
      padding: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-left",
    size: 15
  }), " RunXtreme Half Marathon 2026"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, "Attendees"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)',
      marginTop: 4
    }
  }, attendees.length, " registrations \xB7 ", attendees.filter(a => a.checkedIn).length, " checked in")), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "download",
    size: 15
  }), "Export CSV")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 300,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    placeholder: "Search by name or email",
    value: query,
    onChange: e => setQuery(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)'
    }
  }, rows.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "user-x",
    title: "No attendees match",
    description: "Try a different search term."
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: 'auto',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, ['Attendee', 'Ticket tier', 'Purchased', 'Check-in'].map(h => /*#__PURE__*/React.createElement("th", {
    key: h,
    style: {
      textAlign: 'left',
      padding: '10px 16px',
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      color: 'var(--text-subtle)',
      fontWeight: 600,
      borderBottom: '1px solid var(--border-default)'
    }
  }, h)))), /*#__PURE__*/React.createElement("tbody", null, rows.map(a => /*#__PURE__*/React.createElement("tr", {
    key: a.email
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '14px 16px',
      borderBottom: '1px solid var(--border-default)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      color: 'var(--text-heading)'
    }
  }, a.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--text-muted)'
    }
  }, a.email)), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '14px 16px',
      borderBottom: '1px solid var(--border-default)',
      color: 'var(--text-body)'
    }
  }, a.tier), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '14px 16px',
      borderBottom: '1px solid var(--border-default)',
      color: 'var(--text-body)'
    }
  }, a.purchased), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '14px 16px',
      borderBottom: '1px solid var(--border-default)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => toggle(a.email),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '5px 12px',
      borderRadius: 'var(--radius-pill)',
      fontSize: 12.5,
      fontWeight: 600,
      cursor: 'pointer',
      border: `1px solid ${a.checkedIn ? 'transparent' : 'var(--border-default)'}`,
      background: a.checkedIn ? 'var(--status-success-bg)' : 'var(--surface-card)',
      color: a.checkedIn ? 'var(--status-success-text)' : 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: a.checkedIn ? 'check-circle' : 'circle',
    size: 13
  }), a.checkedIn ? 'Checked in' : 'Not yet')))))))));
}
window.AttendeeList = AttendeeList;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/organiser-portal/AttendeeList.jsx", error: String((e && e.message) || e) }); }

// ui_kits/organiser-portal/Auth.jsx
try { (() => {
const {
  Icon,
  Input,
  Button
} = window.CyRokxDesignSystem_ef2ebf;
function AuthShell({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: 'var(--surface-page)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 420,
      maxWidth: '100%',
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginBottom: 32,
      textAlign: 'center'
    }
  }, "CyRok", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-accent)'
    }
  }, "x"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--text-muted)',
      marginTop: 6
    }
  }, "Organiser portal")), children));
}

/** Login — organiser sign-in: email, password, forgot password. */
function Login({
  onSubmit,
  onGoToSignUp
}) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  return /*#__PURE__*/React.createElement(AuthShell, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginBottom: 4
    }
  }, "Log in"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)',
      marginBottom: 24
    }
  }, "Manage your events and registrations."), /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      onSubmit && onSubmit();
    },
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Email",
    type: "email",
    placeholder: "you@organisation.com",
    value: email,
    onChange: e => setEmail(e.target.value)
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Input, {
    label: "Password",
    type: "password",
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    value: password,
    onChange: e => setPassword(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-link)',
      textDecoration: 'none'
    }
  }, "Forgot password?"))), /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    fullWidth: true,
    size: "lg"
  }, "Log in")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      fontSize: 14,
      color: 'var(--text-muted)',
      marginTop: 24
    }
  }, "New organiser?", ' ', /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onGoToSignUp && onGoToSignUp();
    },
    style: {
      color: 'var(--text-link)',
      fontWeight: 600,
      textDecoration: 'none'
    }
  }, "Sign up")));
}

/** SignUp — organiser onboarding: name, organisation, email, password, verify notice. */
function SignUp({
  onSubmit,
  onGoToLogin
}) {
  const [step, setStep] = React.useState('form');
  const [form, setForm] = React.useState({
    name: '',
    org: '',
    email: '',
    password: ''
  });
  const set = k => e => setForm({
    ...form,
    [k]: e.target.value
  });
  if (step === 'verify') {
    return /*#__PURE__*/React.createElement(AuthShell, null, /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: 'var(--color-accent-tint)',
        color: 'var(--color-accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "mail-check",
      size: 26
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        fontWeight: 700,
        color: 'var(--text-heading)',
        marginBottom: 8
      }
    }, "Verify your email"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        color: 'var(--text-muted)',
        marginBottom: 24,
        lineHeight: 1.5
      }
    }, "We sent a verification link to ", /*#__PURE__*/React.createElement("strong", {
      style: {
        color: 'var(--text-body)'
      }
    }, form.email || 'your inbox'), ". Confirm it to activate your organiser account."), /*#__PURE__*/React.createElement(Button, {
      fullWidth: true,
      size: "lg",
      onClick: () => onSubmit && onSubmit()
    }, "Continue to dashboard")));
  }
  return /*#__PURE__*/React.createElement(AuthShell, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginBottom: 4
    }
  }, "Create your organiser account"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)',
      marginBottom: 24
    }
  }, "Start selling tickets in minutes."), /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      setStep('verify');
    },
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Full name",
    placeholder: "Aditi Rao",
    value: form.name,
    onChange: set('name')
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Organisation",
    placeholder: "Terrace Live Events",
    value: form.org,
    onChange: set('org')
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Email",
    type: "email",
    placeholder: "you@organisation.com",
    value: form.email,
    onChange: set('email')
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Password",
    type: "password",
    placeholder: "At least 8 characters",
    value: form.password,
    onChange: set('password')
  }), /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    fullWidth: true,
    size: "lg"
  }, "Create account")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      fontSize: 14,
      color: 'var(--text-muted)',
      marginTop: 24
    }
  }, "Already have an account?", ' ', /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onGoToLogin && onGoToLogin();
    },
    style: {
      color: 'var(--text-link)',
      fontWeight: 600,
      textDecoration: 'none'
    }
  }, "Log in")));
}
window.OrganiserLogin = Login;
window.OrganiserSignUp = SignUp;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/organiser-portal/Auth.jsx", error: String((e && e.message) || e) }); }

// ui_kits/organiser-portal/CreateEvent.jsx
try { (() => {
const {
  Icon,
  Stepper,
  Input,
  Textarea,
  Select,
  Switch,
  Checkbox,
  Button,
  Badge
} = window.CyRokxDesignSystem_ef2ebf;
const EVENT_TYPES = ['Running', 'Cycling', 'Triathlon', 'Concert', 'Conference', 'Workshop'];
const ENDURANCE = ['Running', 'Cycling', 'Triathlon'];
const ORGS = ['Devodass Hospital', 'RunXtreme Foundation', 'CyRokx Sports', '+ Add organiser…'];
const CURRENCIES = ['Indian Rupees (₹) — INR', 'US Dollar ($) — USD', 'Euro (€) — EUR'];
const STEPS = ['Details', 'Schedule', 'Categories', 'Media', 'Fees & visibility', 'Review'];
function emptyCat() {
  return {
    id: Math.random().toString(36).slice(2),
    name: '',
    distance: '',
    max: '',
    price: '',
    currency: CURRENCIES[0],
    minAge: ''
  };
}
const isEndurance = t => ENDURANCE.includes(t);

/** CreateEvent — hybrid wizard carrying the full OTR section content: details, schedule,
 *  registration period, type-aware categories (endurance → distance/bib), media, processing
 *  fees and private/unlisted visibility with a shareable registration link. */
function CreateEvent({
  onSubmit,
  onCancel
}) {
  const [step, setStep] = React.useState(0);
  const [submitted, setSubmitted] = React.useState(false);
  const [type, setType] = React.useState('Running');
  const [details, setDetails] = React.useState({
    title: '',
    venue: '',
    org: ORGS[0],
    description: ''
  });
  const [schedule, setSchedule] = React.useState({
    start: '',
    end: '',
    sellStart: '',
    sellStop: ''
  });
  const [cats, setCats] = React.useState([{
    ...emptyCat(),
    name: '10K Run',
    distance: '10',
    max: '1000',
    price: '499'
  }]);
  const [media, setMedia] = React.useState({
    banner: false,
    photos: false,
    email: '',
    phone: '',
    website: ''
  });
  const [fees, setFees] = React.useState({
    pct: '4.0',
    userShare: '100'
  });
  const [priv, setPriv] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const endurance = isEndurance(type);
  const shareUrl = `cyrokx.in/e/${(details.title || 'my-event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-event'}?k=8fa2`;
  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));
  const updateCat = (id, k, v) => setCats(cs => cs.map(c => c.id === id ? {
    ...c,
    [k]: v
  } : c));
  const copy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  if (submitted) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        padding: '80px 24px',
        maxWidth: 480,
        margin: '0 auto'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: 'var(--status-success-bg)',
        color: 'var(--color-success)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 30,
      strokeWidth: 2.5
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 22,
        fontWeight: 700,
        color: 'var(--text-heading)',
        marginBottom: 8
      }
    }, priv ? 'Saved as unlisted' : 'Submitted for review'), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        color: 'var(--text-muted)',
        marginBottom: 24,
        lineHeight: 1.5
      }
    }, details.title || 'Your event', " is ", priv ? /*#__PURE__*/React.createElement(React.Fragment, null, "hidden from the public events page. Share the registration link with your participants directly.") : /*#__PURE__*/React.createElement(React.Fragment, null, "now ", /*#__PURE__*/React.createElement(Badge, {
      status: "review"
    }), " with our moderation team. We'll review it within 24 hours.")), priv && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        background: 'var(--surface-accent-secondary-tint)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-control)',
        padding: '10px 12px',
        marginBottom: 24,
        textAlign: 'left'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "link",
      size: 15
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'monospace',
        color: 'var(--text-body)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, shareUrl), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary",
      onClick: copy
    }, copied ? 'Copied' : 'Copy')), /*#__PURE__*/React.createElement(Button, {
      onClick: onSubmit
    }, "Back to my events"));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 760
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, "Create event"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    onClick: onCancel
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "save",
    size: 15
  }), "Save draft"), /*#__PURE__*/React.createElement("button", {
    onClick: onCancel,
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--text-subtle)',
      cursor: 'pointer',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 20
  })))), /*#__PURE__*/React.createElement(Stepper, {
    steps: STEPS,
    activeIndex: step,
    style: {
      marginBottom: 32
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: 28
    }
  }, step === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Event details"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Select, {
    label: "Type",
    value: type,
    onChange: e => setType(e.target.value),
    options: EVENT_TYPES
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Status",
    value: "Draft",
    disabled: true,
    onChange: () => {}
  })), /*#__PURE__*/React.createElement(Input, {
    label: "Title",
    placeholder: "RunXtreme Half Marathon 2026",
    value: details.title,
    onChange: e => setDetails({
      ...details,
      title: e.target.value
    })
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Venue",
    placeholder: "Start location, or \u201CAnywhere\u201D for virtual events",
    value: details.venue,
    onChange: e => setDetails({
      ...details,
      venue: e.target.value
    })
  }), endurance && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      background: 'var(--surface-accent-tint)',
      borderRadius: 'var(--radius-control)',
      padding: '10px 12px',
      fontSize: 13,
      color: 'var(--color-accent)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "flag",
    size: 15
  }), " Endurance event \u2014 distance, minimum age and bib numbers are enabled for this type."), /*#__PURE__*/React.createElement(SectionLabel, {
    style: {
      marginTop: 8
    }
  }, "Organisation"), /*#__PURE__*/React.createElement(Select, {
    label: "Name",
    value: details.org,
    onChange: e => setDetails({
      ...details,
      org: e.target.value
    }),
    options: ORGS
  }), /*#__PURE__*/React.createElement(UploadTile, {
    compact: true,
    label: "Organisation logo",
    hint: "PNG or SVG, square",
    icon: "image"
  }), /*#__PURE__*/React.createElement(SectionLabel, {
    style: {
      marginTop: 8
    }
  }, "Description"), /*#__PURE__*/React.createElement(Textarea, {
    label: null,
    placeholder: "Tell participants about the route, timing and what's included\u2026",
    rows: 5,
    value: details.description,
    onChange: e => setDetails({
      ...details,
      description: e.target.value
    })
  })), step === 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Event schedule"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Start time",
    placeholder: "YYYY-MM-DD HH:mm",
    value: schedule.start,
    onChange: e => setSchedule({
      ...schedule,
      start: e.target.value
    })
  }), /*#__PURE__*/React.createElement(Input, {
    label: "End time",
    placeholder: "YYYY-MM-DD HH:mm",
    value: schedule.end,
    onChange: e => setSchedule({
      ...schedule,
      end: e.target.value
    })
  })), /*#__PURE__*/React.createElement(SectionLabel, {
    style: {
      marginTop: 8
    }
  }, "Registration period"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Start selling tickets after",
    placeholder: "YYYY-MM-DD HH:mm",
    value: schedule.sellStart,
    onChange: e => setSchedule({
      ...schedule,
      sellStart: e.target.value
    })
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Stop selling tickets after",
    placeholder: "YYYY-MM-DD HH:mm",
    value: schedule.sellStop,
    onChange: e => setSchedule({
      ...schedule,
      sellStop: e.target.value
    })
  }))), step === 2 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    style: {
      margin: 0
    }
  }, endurance ? 'Race categories' : 'Ticket tiers'), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: 'var(--text-subtle)'
    }
  }, cats.length, " added")), cats.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    style: {
      marginBottom: 18,
      paddingBottom: 18,
      borderBottom: i < cats.length - 1 ? '1px solid var(--border-default)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: endurance ? '1.4fr 0.8fr 0.9fr 0.9fr 0.9fr auto' : '1.6fr 0.9fr 0.9fr 1fr auto',
      gap: 12,
      alignItems: 'end'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: endurance ? 'Category' : 'Tier name',
    placeholder: endurance ? '10K Run' : 'Early Bird',
    value: c.name,
    onChange: e => updateCat(c.id, 'name', e.target.value)
  }), endurance && /*#__PURE__*/React.createElement(Input, {
    label: "Distance (km)",
    type: "number",
    placeholder: "10",
    value: c.distance,
    onChange: e => updateCat(c.id, 'distance', e.target.value)
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Max tickets",
    type: "number",
    placeholder: "1000",
    value: c.max,
    onChange: e => updateCat(c.id, 'max', e.target.value)
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Price (\u20B9)",
    type: "number",
    placeholder: "499",
    value: c.price,
    onChange: e => updateCat(c.id, 'price', e.target.value)
  }), endurance && /*#__PURE__*/React.createElement(Input, {
    label: "Min age",
    type: "number",
    placeholder: "\u2014",
    value: c.minAge,
    onChange: e => updateCat(c.id, 'minAge', e.target.value)
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setCats(cats.filter(x => x.id !== c.id)),
    disabled: cats.length === 1,
    style: {
      height: 44,
      width: 44,
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-control)',
      background: 'none',
      color: 'var(--text-subtle)',
      cursor: cats.length === 1 ? 'not-allowed' : 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash-2",
    size: 16
  }))))), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    onClick: () => setCats([...cats, emptyCat()])
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 15
  }), "Add ", endurance ? 'category' : 'tier')), step === 3 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Media"), /*#__PURE__*/React.createElement(UploadTile, {
    label: "Header image (banner)",
    hint: "1600\xD7600 recommended",
    icon: "image",
    active: media.banner,
    onClick: () => setMedia({
      ...media,
      banner: !media.banner
    })
  }), /*#__PURE__*/React.createElement(UploadTile, {
    label: "Event photos",
    hint: "Up to 8 images",
    icon: "images",
    active: media.photos,
    onClick: () => setMedia({
      ...media,
      photos: !media.photos
    })
  }), /*#__PURE__*/React.createElement(SectionLabel, {
    style: {
      marginTop: 8
    }
  }, "Contact information"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Email",
    type: "email",
    placeholder: "Enter event email",
    value: media.email,
    onChange: e => setMedia({
      ...media,
      email: e.target.value
    })
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Phone",
    type: "tel",
    placeholder: "Enter phone number",
    value: media.phone,
    onChange: e => setMedia({
      ...media,
      phone: e.target.value
    })
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Website",
    placeholder: "Enter website",
    value: media.website,
    onChange: e => setMedia({
      ...media,
      website: e.target.value
    })
  }))), step === 4 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Processing fees"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Percentage",
    type: "number",
    value: fees.pct,
    onChange: e => setFees({
      ...fees,
      pct: e.target.value
    })
  }), /*#__PURE__*/React.createElement(Input, {
    label: "% of processing fees paid by user",
    type: "number",
    value: fees.userShare,
    onChange: e => setFees({
      ...fees,
      userShare: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--color-off-white)',
      borderRadius: 'var(--radius-control)',
      padding: 14,
      fontSize: 13,
      color: 'var(--text-muted)',
      lineHeight: 1.5
    }
  }, "A ", fees.pct || '0', "% processing fee applies per order. ", fees.userShare === '100' ? 'The buyer covers it in full at checkout.' : fees.userShare === '0' ? 'You absorb it — it is deducted from your payout.' : `The buyer pays ${fees.userShare || '0'}%; the remainder is deducted from your payout.`), /*#__PURE__*/React.createElement(SectionLabel, {
    style: {
      marginTop: 8
    }
  }, "Visibility"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-control)',
      padding: 16
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    label: "Do not list this event publicly",
    checked: priv,
    onChange: e => setPriv(e.target.checked)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      paddingLeft: 2
    }
  }, "Hidden from the events page but still accessible by URL \u2014 circulate the link for private registration."), priv && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      marginTop: 10,
      background: 'var(--surface-accent-secondary-tint)',
      borderRadius: 'var(--radius-control)',
      padding: '10px 12px'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "link",
    size: 15
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 13,
      fontFamily: 'monospace',
      color: 'var(--text-body)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, shareUrl), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary",
    onClick: copy
  }, copied ? 'Copied' : 'Copy link')))), step === 5 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(ReviewRow, {
    label: "Type",
    value: type
  }), /*#__PURE__*/React.createElement(ReviewRow, {
    label: "Title",
    value: details.title || '—'
  }), /*#__PURE__*/React.createElement(ReviewRow, {
    label: "Venue",
    value: details.venue || '—'
  }), /*#__PURE__*/React.createElement(ReviewRow, {
    label: "Organisation",
    value: details.org
  }), /*#__PURE__*/React.createElement(ReviewRow, {
    label: "Schedule",
    value: schedule.start ? `${schedule.start} → ${schedule.end || '—'}` : '—'
  }), /*#__PURE__*/React.createElement(ReviewRow, {
    label: endurance ? 'Race categories' : 'Ticket tiers',
    value: `${cats.length} configured`
  }), /*#__PURE__*/React.createElement(ReviewRow, {
    label: "Processing fee",
    value: `${fees.pct || '0'}% · buyer pays ${fees.userShare || '0'}%`
  }), /*#__PURE__*/React.createElement(ReviewRow, {
    label: "Visibility",
    value: priv ? 'Unlisted (link only)' : 'Public'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--color-off-white)',
      borderRadius: 'var(--radius-control)',
      padding: 14,
      fontSize: 13,
      color: 'var(--text-muted)',
      lineHeight: 1.5
    }
  }, priv ? 'Saving keeps this event unlisted — it won\u2019t appear on the public events page. You can publish it later from the event dashboard.' : 'Submitting sends this event to our moderation team. We\u2019ll review it within 24 hours before it goes live.'))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    onClick: step === 0 ? onCancel : back
  }, step === 0 ? 'Cancel' : 'Back'), step < STEPS.length - 1 ? /*#__PURE__*/React.createElement(Button, {
    onClick: next
  }, "Continue") : /*#__PURE__*/React.createElement(Button, {
    onClick: () => setSubmitted(true)
  }, priv ? 'Save unlisted event' : 'Submit for review')));
}
function SectionLabel({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--text-heading)',
      ...style
    }
  }, children);
}
function UploadTile({
  label,
  hint,
  icon,
  active,
  onClick,
  compact
}) {
  return /*#__PURE__*/React.createElement("div", null, label && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-heading)',
      marginBottom: 8
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      height: compact ? 72 : 130,
      borderRadius: 'var(--radius-card)',
      border: `1.5px dashed ${active ? 'var(--color-accent)' : 'var(--border-default)'}`,
      background: active ? 'var(--surface-accent-tint)' : 'var(--color-off-white)',
      display: 'flex',
      flexDirection: compact ? 'row' : 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      cursor: onClick ? 'pointer' : 'default',
      color: active ? 'var(--color-accent)' : 'var(--text-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: active ? 'check-circle' : icon,
    size: compact ? 20 : 26
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13
    }
  }, active ? 'Uploaded — click to replace' : `Choose file · ${hint}`)));
}
function ReviewRow({
  label,
  value
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      paddingBottom: 14,
      borderBottom: '1px solid var(--border-default)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      fontWeight: 600
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--text-heading)',
      fontWeight: 600,
      textAlign: 'right'
    }
  }, value));
}
window.CreateEvent = CreateEvent;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/organiser-portal/CreateEvent.jsx", error: String((e && e.message) || e) }); }

// ui_kits/organiser-portal/EventCategories.jsx
try { (() => {
const {
  Icon,
  Input,
  Select,
  Textarea,
  Switch,
  Checkbox,
  Button,
  Badge
} = window.CyRokxDesignSystem_ef2ebf;
const CAT_CURRENCIES = ['Indian Rupees (₹) — INR', 'US Dollar ($) — USD', 'Euro (€) — EUR'];
const INITIAL_CATS = [{
  id: 'c1',
  name: '10K Run',
  distance: '10',
  price: '499',
  max: '1000',
  sold: 640,
  start: '2026-07-26 05:00',
  end: '2026-07-26 11:00',
  currency: CAT_CURRENCIES[0],
  minAge: '16',
  enabled: true,
  hidden: false,
  desc: 'Open category. Chip timing included.'
}, {
  id: 'c2',
  name: '21K Half Marathon',
  distance: '21',
  price: '899',
  max: '600',
  sold: 512,
  start: '2026-07-26 05:00',
  end: '2026-07-26 12:00',
  currency: CAT_CURRENCIES[0],
  minAge: '18',
  enabled: true,
  hidden: false,
  desc: 'Minimum age 18. Finisher medal + tee.'
}, {
  id: 'c3',
  name: '5K Fun Run',
  distance: '5',
  price: '299',
  max: '1500',
  sold: 210,
  start: '2026-07-26 06:00',
  end: '2026-07-26 10:00',
  currency: CAT_CURRENCIES[0],
  minAge: '',
  enabled: false,
  hidden: true,
  desc: 'Family category, all ages welcome.'
}];

/** EventCategories — race category manager: enable/hide, timing, distance, capacity, price,
 *  currency, minimum age and description per category (event dashboard → Categories tab). */
function EventCategories() {
  const [cats, setCats] = React.useState(INITIAL_CATS);
  const [activeId, setActiveId] = React.useState('c1');
  const active = cats.find(c => c.id === activeId) || cats[0];
  const patch = (k, v) => setCats(cs => cs.map(c => c.id === active.id ? {
    ...c,
    [k]: v
  } : c));
  const addCat = () => {
    const id = Math.random().toString(36).slice(2);
    setCats([...cats, {
      id,
      name: 'New category',
      distance: '',
      price: '0',
      max: '',
      sold: 0,
      start: '',
      end: '',
      currency: CAT_CURRENCIES[0],
      minAge: '',
      enabled: true,
      hidden: false,
      desc: ''
    }]);
    setActiveId(id);
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(PanelHead, {
    title: "Categories",
    subtitle: "Distances, capacity and pricing participants choose at registration."
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: addCat
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 15
  }), "Add category")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '320px 1fr',
      gap: 20,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, cats.map(c => {
    const on = c.id === active.id;
    const pct = c.max ? Math.min(100, Math.round(c.sold / +c.max * 100)) : 0;
    return /*#__PURE__*/React.createElement("button", {
      key: c.id,
      onClick: () => setActiveId(c.id),
      style: {
        textAlign: 'left',
        cursor: 'pointer',
        background: 'var(--surface-card)',
        border: `1.5px solid ${on ? 'var(--color-accent)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-card)',
        padding: 16,
        boxShadow: on ? 'var(--shadow-card)' : 'none'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15,
        fontWeight: 700,
        color: 'var(--text-heading)'
      }
    }, c.name), c.enabled ? /*#__PURE__*/React.createElement(Badge, {
      status: "live"
    }, "Enabled") : /*#__PURE__*/React.createElement(Badge, {
      status: "draft"
    }, "Disabled")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 14,
        fontSize: 12.5,
        color: 'var(--text-muted)',
        marginBottom: 10
      }
    }, c.distance && /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 4
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "route",
      size: 13
    }), c.distance, " km"), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 4
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "indian-rupee",
      size: 13
    }), c.price), c.hidden && /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 4
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "eye-off",
      size: 13
    }), "Hidden")), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 6,
        borderRadius: 999,
        background: 'var(--color-off-white)',
        overflow: 'hidden',
        marginBottom: 5
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: '100%',
        width: `${pct}%`,
        background: 'var(--color-accent)'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--text-subtle)'
      }
    }, c.sold, " / ", c.max || '∞', " sold"));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      marginBottom: 22,
      paddingBottom: 18,
      borderBottom: '1px solid var(--border-default)'
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    label: "Enabled",
    checked: active.enabled,
    onChange: e => patch('enabled', e.target.checked)
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Hide on event page",
    checked: active.hidden,
    onChange: e => patch('hidden', e.target.checked)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Title",
    placeholder: "Enter title",
    value: active.name,
    onChange: e => patch('name', e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Category start time",
    placeholder: "YYYY-MM-DD HH:mm",
    value: active.start,
    onChange: e => patch('start', e.target.value)
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Category end time",
    placeholder: "YYYY-MM-DD HH:mm",
    value: active.end,
    onChange: e => patch('end', e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Distance (km)",
    type: "number",
    placeholder: "Enter distance",
    value: active.distance,
    onChange: e => patch('distance', e.target.value)
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Maximum number of tickets",
    type: "number",
    placeholder: "1000",
    value: active.max,
    onChange: e => patch('max', e.target.value)
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Minimum age",
    type: "number",
    placeholder: "Leave blank for none",
    value: active.minAge,
    onChange: e => patch('minAge', e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1.4fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Price",
    type: "number",
    placeholder: "0.0",
    value: active.price,
    onChange: e => patch('price', e.target.value)
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Currency",
    value: active.currency,
    onChange: e => patch('currency', e.target.value),
    options: CAT_CURRENCIES
  })), /*#__PURE__*/React.createElement(Textarea, {
    label: "Category description (age, gender requirements etc.)",
    placeholder: "Describe eligibility, inclusions and requirements\u2026",
    rows: 4,
    value: active.desc,
    onChange: e => patch('desc', e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, "Automatic price discount"), /*#__PURE__*/React.createElement(Button, {
    size: "sm"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "save",
    size: 15
  }), "Save category"))))));
}
function PanelHead({
  title,
  subtitle,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--text-muted)',
      marginTop: 3
    }
  }, subtitle)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flexShrink: 0
    }
  }, children));
}
window.EventCategories = EventCategories;
window.PanelHead = PanelHead;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/organiser-portal/EventCategories.jsx", error: String((e && e.message) || e) }); }

// ui_kits/organiser-portal/EventDiscounts.jsx
try { (() => {
const {
  Icon,
  Input,
  Select,
  Textarea,
  Switch,
  Button,
  Badge
} = window.CyRokxDesignSystem_ef2ebf;
const DiscPanelHead = window.PanelHead;
const DISC_CATS = ['All categories', '10K Run', '21K Half Marathon', '5K Fun Run'];
const INITIAL_DISCOUNTS = [{
  id: 'd1',
  code: 'RUNXTREME-30',
  desc: '30% early-bird for the 21K category',
  cat: '21K Half Marathon',
  start: '2026-06-01 00:00',
  end: '2026-06-30 23:59',
  pct: '30',
  abs: '0',
  max: '100',
  claimed: 63,
  enabled: true
}, {
  id: 'd2',
  code: 'TEAM10',
  desc: 'Flat ₹100 off for club registrations',
  cat: 'All categories',
  start: '',
  end: '',
  pct: '0',
  abs: '100',
  max: '250',
  claimed: 41,
  enabled: true
}, {
  id: 'd3',
  code: '(auto) FINISHER',
  desc: 'Auto-applied loyalty discount at checkout',
  cat: 'All categories',
  start: '',
  end: '',
  pct: '10',
  abs: '0',
  max: '500',
  claimed: 128,
  enabled: false
}];

/** EventDiscounts — discount code manager: create codes (blank = auto-apply), scope to a
 *  category, set window, percentage/absolute value and max claims (event dashboard → Discounts tab). */
function EventDiscounts() {
  const [list, setList] = React.useState(INITIAL_DISCOUNTS);
  const [activeId, setActiveId] = React.useState('new');
  const blank = {
    id: 'new',
    code: '',
    desc: '',
    cat: DISC_CATS[0],
    start: '',
    end: '',
    pct: '0',
    abs: '0',
    max: '100',
    claimed: 0,
    enabled: true
  };
  const [draft, setDraft] = React.useState(blank);
  const active = activeId === 'new' ? draft : list.find(d => d.id === activeId) || draft;
  const patch = (k, v) => {
    if (activeId === 'new') setDraft(d => ({
      ...d,
      [k]: v
    }));else setList(ls => ls.map(d => d.id === activeId ? {
      ...d,
      [k]: v
    } : d));
  };
  const startNew = () => {
    setDraft(blank);
    setActiveId('new');
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(DiscPanelHead, {
    title: "Discounts",
    subtitle: "Codes buyers enter at checkout, or auto-applied offers. Leave the code blank to auto-apply."
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: startNew
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 15
  }), "New discount")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '340px 1fr',
      gap: 20,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, list.map(d => {
    const on = d.id === active.id;
    const pct = d.max ? Math.min(100, Math.round(d.claimed / +d.max * 100)) : 0;
    return /*#__PURE__*/React.createElement("button", {
      key: d.id,
      onClick: () => setActiveId(d.id),
      style: {
        textAlign: 'left',
        cursor: 'pointer',
        background: 'var(--surface-card)',
        border: `1.5px solid ${on ? 'var(--color-accent)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-card)',
        padding: 16,
        boxShadow: on ? 'var(--shadow-card)' : 'none'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--text-heading)',
        fontFamily: 'monospace'
      }
    }, d.code || 'Auto-apply'), d.enabled ? /*#__PURE__*/React.createElement(Badge, {
      status: "live"
    }, "Active") : /*#__PURE__*/React.createElement(Badge, {
      status: "draft"
    }, "Off")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: 'var(--text-muted)',
        marginBottom: 10
      }
    }, d.pct !== '0' && d.pct ? `${d.pct}% off` : '', d.pct !== '0' && d.pct && d.abs !== '0' && d.abs ? ' · ' : '', d.abs !== '0' && d.abs ? `₹${d.abs} off` : '', " \xB7 ", d.cat), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 6,
        borderRadius: 999,
        background: 'var(--color-off-white)',
        overflow: 'hidden',
        marginBottom: 5
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: '100%',
        width: `${pct}%`,
        background: 'var(--color-accent)'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--text-subtle)'
      }
    }, d.claimed, " / ", d.max, " claimed"));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginBottom: 20
    }
  }, activeId === 'new' ? 'New discount' : 'Edit discount'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Input, {
    label: "Discount code",
    placeholder: "RUNXTREME-30",
    value: active.code,
    onChange: e => patch('code', e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--text-subtle)',
      marginTop: 5
    }
  }, "Leave blank to auto-apply on checkout.")), /*#__PURE__*/React.createElement(Textarea, {
    label: "Description",
    placeholder: "Discount description",
    rows: 2,
    value: active.desc,
    onChange: e => patch('desc', e.target.value)
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Event category (leave blank to apply to all categories)",
    value: active.cat,
    onChange: e => patch('cat', e.target.value),
    options: DISC_CATS
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Start time",
    placeholder: "YYYY-MM-DD HH:mm",
    value: active.start,
    onChange: e => patch('start', e.target.value)
  }), /*#__PURE__*/React.createElement(Input, {
    label: "End time",
    placeholder: "YYYY-MM-DD HH:mm",
    value: active.end,
    onChange: e => patch('end', e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Percentage discount (% off final price)",
    type: "number",
    placeholder: "0.0",
    value: active.pct,
    onChange: e => patch('pct', e.target.value)
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Absolute discount (\u20B9 off final price)",
    type: "number",
    placeholder: "0.0",
    value: active.abs,
    onChange: e => patch('abs', e.target.value)
  })), /*#__PURE__*/React.createElement(Input, {
    label: "Max available count (how many buyers can claim this discount?)",
    type: "number",
    placeholder: "100",
    value: active.max,
    onChange: e => patch('max', e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 6,
      borderTop: '1px solid var(--border-default)'
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    label: "Enabled",
    checked: active.enabled,
    onChange: e => patch('enabled', e.target.checked)
  }), /*#__PURE__*/React.createElement(Button, null, /*#__PURE__*/React.createElement(Icon, {
    name: "save",
    size: 15
  }), "Save discount"))))));
}
window.EventDiscounts = EventDiscounts;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/organiser-portal/EventDiscounts.jsx", error: String((e && e.message) || e) }); }

// ui_kits/organiser-portal/EventOrders.jsx
try { (() => {
const {
  Icon,
  Input,
  Button,
  Badge
} = window.CyRokxDesignSystem_ef2ebf;
const OrdPanelHead = window.PanelHead;
const ORDERS = [{
  id: 318581,
  hash: 'q3T1OBK',
  name: 'Dr Ajay Kumar',
  email: 'iamdrajay@gmail.com',
  time: '10:54 · 15 Jul',
  status: 'Completed'
}, {
  id: 318552,
  hash: '1gT9QGW',
  name: 'Parveen Kumar',
  email: 'pkgoyal15@gmail.com',
  time: '06:33 · 15 Jul',
  status: 'Completed'
}, {
  id: 318542,
  hash: 'WoTdLkK',
  name: 'Bikramjeet Singh',
  email: 'bschattha2266@gmail.com',
  time: '23:30 · 14 Jul',
  status: 'Completed'
}, {
  id: 318510,
  hash: 'ykTN3ZE',
  name: 'Mahima Kaur',
  email: 'rinpykk@gmail.com',
  time: '21:02 · 14 Jul',
  status: 'Completed'
}, {
  id: 318453,
  hash: 'z1ToEPR',
  name: 'Sudhir Khatri',
  email: 'khatrisudhir403@gmail.com',
  time: '14:18 · 14 Jul',
  status: 'Completed'
}, {
  id: 318449,
  hash: 'mR4kP2x',
  name: 'Neha Verma',
  email: 'neha.verma@gmail.com',
  time: '12:40 · 14 Jul',
  status: 'Incomplete'
}, {
  id: 318431,
  hash: '9WTqj8q',
  name: 'Ankur Mohan',
  email: 'doctorocks@gmail.com',
  time: '10:52 · 14 Jul',
  status: 'Completed'
}, {
  id: 318410,
  hash: 'P1ToJOW',
  name: 'Aakula Srinu',
  email: 'aakulasrinu606@gmail.com',
  time: '06:10 · 14 Jul',
  status: 'Completed'
}, {
  id: 318393,
  hash: 'rVTgK6k',
  name: 'Bhavin Chauhan',
  email: 'chauhanbhavin255@gmail.com',
  time: '23:24 · 13 Jul',
  status: 'Completed'
}, {
  id: 318388,
  hash: 'bQ7wZ0t',
  name: 'Ritu Malhotra',
  email: 'ritu.malhotra@yahoo.in',
  time: '22:51 · 13 Jul',
  status: 'Incomplete'
}, {
  id: 318376,
  hash: 'KJTbDJ8',
  name: 'Himanshu Suman',
  email: 'himanshusuman9414@gmail.com',
  time: '22:08 · 13 Jul',
  status: 'Completed'
}, {
  id: 318372,
  hash: '2GTdlWl',
  name: 'Vidur Monga',
  email: 'vidur.monga03@gmail.com',
  time: '22:04 · 13 Jul',
  status: 'Completed'
}, {
  id: 318360,
  hash: 'aQTWdLl',
  name: 'Vicky Yadav',
  email: 'vickyyadav76890@gmail.com',
  time: '21:33 · 13 Jul',
  status: 'Completed'
}, {
  id: 318346,
  hash: 'bwTG0n6',
  name: 'Aditi Punia',
  email: 'aditi.punia@yahoo.in',
  time: '21:06 · 13 Jul',
  status: 'Completed'
}];

/** EventOrders — order ledger: Excel export, completed/incomplete filter, search by name/email
 *  or registration ID, per-row invoice download (event dashboard → Orders tab). */
function EventOrders() {
  const [showIncomplete, setShowIncomplete] = React.useState(false);
  const [kw, setKw] = React.useState('');
  const [rid, setRid] = React.useState('');
  const rows = ORDERS.filter(o => {
    if (!showIncomplete && o.status !== 'Completed') return false;
    if (showIncomplete && o.status !== 'Incomplete') return false;
    if (kw && !`${o.name} ${o.email}`.toLowerCase().includes(kw.toLowerCase())) return false;
    if (rid && !String(o.id).includes(rid)) return false;
    return true;
  });
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(OrdPanelHead, {
    title: "Orders",
    subtitle: `${ORDERS.filter(o => o.status === 'Completed').length} completed · ${ORDERS.filter(o => o.status === 'Incomplete').length} incomplete`
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "download",
    size: 15
  }), "Download completed orders (Excel)"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: showIncomplete ? 'primary' : 'ghost',
    onClick: () => setShowIncomplete(v => !v)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: showIncomplete ? 'check-circle' : 'clock',
    size: 15
  }), showIncomplete ? 'Showing incomplete' : 'Show incomplete orders')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginBottom: 18,
      alignItems: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: null,
    icon: "search",
    placeholder: "Search name or email",
    value: kw,
    onChange: e => setKw(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 240
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: null,
    placeholder: "Registration ID",
    value: rid,
    onChange: e => setRid(e.target.value)
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 16
  }), "Search")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, ['#', 'Order hash', 'Buyer name', 'Buyer email', 'Time', 'Status', 'Invoice'].map(h => /*#__PURE__*/React.createElement("th", {
    key: h,
    style: {
      textAlign: h === 'Invoice' ? 'center' : 'left',
      padding: '12px 18px',
      fontSize: 11.5,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--text-subtle)',
      fontWeight: 600,
      borderBottom: '1px solid var(--border-default)'
    }
  }, h)))), /*#__PURE__*/React.createElement("tbody", null, rows.map(o => {
    const done = o.status === 'Completed';
    return /*#__PURE__*/React.createElement("tr", {
      key: o.id,
      style: {
        background: done ? 'var(--status-success-bg)' : 'transparent',
        borderBottom: '1px solid var(--border-default)'
      }
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '13px 18px',
        color: 'var(--text-muted)',
        fontVariantNumeric: 'tabular-nums'
      }
    }, o.id), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '13px 18px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'monospace',
        color: 'var(--text-link)',
        fontWeight: 600
      }
    }, o.hash)), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '13px 18px',
        color: 'var(--text-heading)',
        fontWeight: 600
      }
    }, o.name), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '13px 18px',
        color: 'var(--text-body)'
      }
    }, o.email), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '13px 18px',
        color: 'var(--text-muted)',
        whiteSpace: 'nowrap'
      }
    }, o.time), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '13px 18px'
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      status: done ? 'approved' : 'review'
    }, o.status)), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '13px 18px',
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("button", {
      title: "Download invoice",
      disabled: !done,
      style: {
        width: 34,
        height: 34,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-control)',
        background: 'var(--surface-card)',
        color: done ? 'var(--color-accent-secondary)' : 'var(--text-subtle)',
        cursor: done ? 'pointer' : 'not-allowed',
        opacity: done ? 1 : 0.5
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "file-text",
      size: 16
    }))));
  }))), !rows.length && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 48,
      textAlign: 'center',
      color: 'var(--text-subtle)',
      fontSize: 14
    }
  }, "No orders match your filters.")));
}
window.EventOrders = EventOrders;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/organiser-portal/EventOrders.jsx", error: String((e && e.message) || e) }); }

// ui_kits/organiser-portal/EventRegistrationForm.jsx
try { (() => {
const {
  Icon,
  Select,
  Switch,
  Button
} = window.CyRokxDesignSystem_ef2ebf;
const RegPanelHead = window.PanelHead;
const ADDABLE = ['Blood group', 'Club / team name', 'Nationality', 'Medical conditions', 'Estimated finish time', 'Photo ID number'];
const INITIAL_FIELDS = [{
  id: 'f1',
  name: 'Full Name',
  type: 'text',
  meta: 'Placeholder: Enter full name…',
  required: true,
  order: 1,
  enabled: true,
  locked: true
}, {
  id: 'f2',
  name: 'Birth Date',
  type: 'date',
  meta: 'Placeholder: YYYY-MM-DD',
  required: true,
  order: 2,
  enabled: true,
  locked: true
}, {
  id: 'f3',
  name: 'Gender',
  type: 'select',
  meta: 'Options: Male, Female, Other',
  required: true,
  order: 3,
  enabled: true
}, {
  id: 'f4',
  name: 'Address',
  type: 'text',
  meta: 'Placeholder: Address with city',
  required: true,
  order: 4,
  enabled: true
}, {
  id: 'f5',
  name: 'T-shirt Size',
  type: 'select',
  meta: 'Options: XXS, XS, S, M, L, XL, XXL, XXXL, 4XL',
  required: true,
  order: 5,
  enabled: true
}, {
  id: 'f6',
  name: 'Mobile Number',
  type: 'text',
  meta: 'Placeholder: Your mobile number',
  required: true,
  order: 6,
  enabled: true
}, {
  id: 'f7',
  name: 'Emergency Contact Number',
  type: 'text',
  meta: 'Placeholder: Emergency contact',
  required: true,
  order: 7,
  enabled: true
}];

/** EventRegistrationForm — form-field builder: add fields, then set required / display order /
 *  enabled per row with save + delete controls (event dashboard → Registration Form tab). */
function EventRegistrationForm() {
  const [fields, setFields] = React.useState(INITIAL_FIELDS);
  const [pick, setPick] = React.useState('');
  const patch = (id, k, v) => setFields(fs => fs.map(f => f.id === id ? {
    ...f,
    [k]: v
  } : f));
  const addField = () => {
    if (!pick) return;
    setFields([...fields, {
      id: Math.random().toString(36).slice(2),
      name: pick,
      type: 'text',
      meta: 'Placeholder: —',
      required: false,
      order: fields.length + 1,
      enabled: true
    }]);
    setPick('');
  };
  const remove = id => setFields(fs => fs.filter(f => f.id !== id));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(RegPanelHead, {
    title: "Registration form",
    subtitle: "Fields every participant fills in when they register. Name and Birth Date are required by the system."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: 24,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginBottom: 14
    }
  }, "Add field"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Select, {
    label: null,
    value: pick,
    onChange: e => setPick(e.target.value),
    options: ADDABLE,
    placeholder: "Select a field to add to the form"
  })), /*#__PURE__*/React.createElement(Button, {
    onClick: addField
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 16
  }), "Add field"))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: 'var(--text-heading)',
      padding: '18px 22px 4px'
    }
  }, "Form fields"), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, ['Field', 'Required', 'Order', 'Enabled', ''].map((h, i) => /*#__PURE__*/React.createElement("th", {
    key: h || i,
    style: {
      textAlign: i === 0 ? 'left' : 'center',
      padding: '12px 22px',
      fontSize: 11.5,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--text-subtle)',
      fontWeight: 600,
      borderBottom: '1px solid var(--border-default)',
      width: i === 0 ? 'auto' : 120
    }
  }, h)))), /*#__PURE__*/React.createElement("tbody", null, fields.map((f, i) => /*#__PURE__*/React.createElement("tr", {
    key: f.id,
    style: {
      borderBottom: i < fields.length - 1 ? '1px solid var(--border-default)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '16px 22px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14.5,
      fontWeight: 600,
      color: 'var(--text-heading)'
    }
  }, f.name), f.locked && /*#__PURE__*/React.createElement("span", {
    title: "System field",
    style: {
      display: 'inline-flex',
      color: 'var(--text-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "lock",
    size: 13
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, "Type: ", f.type, " \xB7 ", f.meta)), /*#__PURE__*/React.createElement("td", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    checked: f.required,
    onChange: e => patch(f.id, 'required', e.target.checked)
  })), /*#__PURE__*/React.createElement("td", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: f.order,
    onChange: e => patch(f.id, 'order', e.target.value),
    style: {
      width: 56,
      textAlign: 'center',
      padding: '7px 6px',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-control)',
      fontSize: 14,
      fontFamily: 'var(--font-sans)',
      color: 'var(--text-heading)'
    }
  })), /*#__PURE__*/React.createElement("td", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    checked: f.enabled,
    onChange: e => patch(f.id, 'enabled', e.target.checked)
  })), /*#__PURE__*/React.createElement("td", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    title: "Save",
    style: iconBtn('var(--color-accent-secondary)')
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "save",
    size: 16
  })), /*#__PURE__*/React.createElement("button", {
    title: "Delete",
    onClick: () => remove(f.id),
    disabled: f.locked,
    style: iconBtn('var(--color-error)', f.locked)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash-2",
    size: 16
  }))))))))));
}
function iconBtn(color, disabled) {
  return {
    width: 34,
    height: 34,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-control)',
    background: 'var(--surface-card)',
    color: disabled ? 'var(--text-subtle)' : color,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1
  };
}
window.EventRegistrationForm = EventRegistrationForm;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/organiser-portal/EventRegistrationForm.jsx", error: String((e && e.message) || e) }); }

// ui_kits/organiser-portal/EventTax.jsx
try { (() => {
const {
  Icon,
  Input,
  Select,
  Switch,
  Button,
  Badge
} = window.CyRokxDesignSystem_ef2ebf;
const TaxPanelHead = window.PanelHead;
const TAX_MODE = ['Added at checkout (exclusive)', 'Included in ticket price (inclusive)'];

/** EventTax — tax configuration: registration number, rate, inclusive/exclusive handling and
 *  per-category overrides shown on invoices (event dashboard → Tax tab). */
function EventTax() {
  const [enabled, setEnabled] = React.useState(true);
  const [gstin, setGstin] = React.useState('29ABCDE1234F1Z5');
  const [label, setLabel] = React.useState('GST');
  const [rate, setRate] = React.useState('18');
  const [mode, setMode] = React.useState(TAX_MODE[0]);
  const [overrides, setOverrides] = React.useState([{
    id: 't1',
    cat: '10K Run',
    rate: '18',
    on: false
  }, {
    id: 't2',
    cat: '21K Half Marathon',
    rate: '18',
    on: false
  }, {
    id: 't3',
    cat: '5K Fun Run',
    rate: '5',
    on: true
  }]);
  const patch = (id, k, v) => setOverrides(os => os.map(o => o.id === id ? {
    ...o,
    [k]: v
  } : o));
  const sample = 899;
  const taxAmt = enabled ? Math.round(sample * (+rate / 100)) : 0;
  const total = mode === TAX_MODE[0] ? sample + taxAmt : sample;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(TaxPanelHead, {
    title: "Tax",
    subtitle: "Applied to every order and itemised on participant invoices."
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "save",
    size: 15
  }), "Save tax settings")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 320px',
      gap: 20,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      marginBottom: 22,
      paddingBottom: 18,
      borderBottom: '1px solid var(--border-default)'
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    label: "Collect tax for this event",
    checked: enabled,
    onChange: e => setEnabled(e.target.checked)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      paddingLeft: 2
    }
  }, "When off, orders are processed with no tax line and invoices show the ticket price only.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      opacity: enabled ? 1 : 0.5,
      pointerEvents: enabled ? 'auto' : 'none'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Tax registration number (GSTIN)",
    placeholder: "29ABCDE1234F1Z5",
    value: gstin,
    onChange: e => setGstin(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Tax label",
    placeholder: "GST",
    value: label,
    onChange: e => setLabel(e.target.value)
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Default rate (%)",
    type: "number",
    value: rate,
    onChange: e => setRate(e.target.value)
  })), /*#__PURE__*/React.createElement(Select, {
    label: "How tax is applied",
    value: mode,
    onChange: e => setMode(e.target.value),
    options: TAX_MODE
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginBottom: 4
    }
  }, "Per-category overrides"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--text-muted)',
      marginBottom: 12
    }
  }, "Charge a different rate for specific categories \u2014 otherwise the default ", rate || '0', "% applies."), /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-control)',
      overflow: 'hidden'
    }
  }, overrides.map((o, i) => /*#__PURE__*/React.createElement("div", {
    key: o.id,
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 130px 120px',
      gap: 12,
      alignItems: 'center',
      padding: '12px 16px',
      borderBottom: i < overrides.length - 1 ? '1px solid var(--border-default)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text-heading)'
    }
  }, o.cat), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: o.rate,
    disabled: !o.on,
    onChange: e => patch(o.id, 'rate', e.target.value),
    style: {
      width: 62,
      padding: '7px 8px',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-control)',
      fontSize: 14,
      fontFamily: 'var(--font-sans)',
      color: o.on ? 'var(--text-heading)' : 'var(--text-subtle)',
      background: o.on ? '#fff' : 'var(--color-off-white)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      justifySelf: 'end'
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    checked: o.on,
    onChange: e => patch(o.id, 'on', e.target.checked)
  })))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginBottom: 4
    }
  }, "Invoice preview"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--text-muted)',
      marginBottom: 16
    }
  }, "21K Half Marathon \xB7 1 ticket"), /*#__PURE__*/React.createElement(PreviewRow, {
    label: "Ticket price",
    value: `₹${sample.toLocaleString('en-IN')}`
  }), /*#__PURE__*/React.createElement(PreviewRow, {
    label: `${label || 'Tax'} (${enabled ? rate || 0 : 0}%)${mode === TAX_MODE[1] ? ' incl.' : ''}`,
    value: enabled ? `₹${taxAmt.toLocaleString('en-IN')}` : '₹0',
    muted: mode === TAX_MODE[1]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      paddingTop: 12,
      marginTop: 6,
      borderTop: '1.5px solid var(--border-default)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, "Total"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--color-accent)'
    }
  }, "\u20B9", total.toLocaleString('en-IN'))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      fontSize: 12,
      color: 'var(--text-subtle)',
      display: 'flex',
      gap: 6,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 14
  }), " ", mode === TAX_MODE[1] ? 'Tax is already part of the ticket price shown to buyers.' : 'Tax is added on top at checkout.'))));
}
function PreviewRow({
  label,
  value,
  muted
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '7px 0',
      fontSize: 13.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      color: muted ? 'var(--text-subtle)' : 'var(--text-body)',
      fontWeight: 600
    }
  }, value));
}
window.EventTax = EventTax;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/organiser-portal/EventTax.jsx", error: String((e && e.message) || e) }); }

// ui_kits/organiser-portal/MyEvents.jsx
try { (() => {
const {
  Icon,
  Input,
  Select,
  Badge,
  Button,
  DataTable,
  EmptyState
} = window.CyRokxDesignSystem_ef2ebf;
const EVENTS = [{
  title: 'Jazz Night at The Terrace',
  date: 'Sat, 12 Jul',
  city: 'Mumbai',
  status: 'live',
  registrations: 214,
  revenue: '₹1.7L'
}, {
  title: 'Watercolour Workshop',
  date: 'Sat, 19 Jul',
  city: 'Bengaluru',
  status: 'live',
  registrations: 38,
  revenue: '₹45.6K'
}, {
  title: 'Street Food Fest',
  date: 'Fri, 25 Jul',
  city: 'Mumbai',
  status: 'approved',
  registrations: 0,
  revenue: '₹0'
}, {
  title: 'Indie Rock Live',
  date: 'Thu, 17 Jul',
  city: 'Pune',
  status: 'rejected',
  registrations: 0,
  revenue: '₹0'
}, {
  title: 'Improv Comedy Jam',
  date: 'Sat, 19 Jul',
  city: 'Delhi',
  status: 'review',
  registrations: 0,
  revenue: '₹0'
}, {
  title: 'Marathon Expo',
  date: 'Sun, 20 Jul',
  city: 'Mumbai',
  status: 'draft',
  registrations: 0,
  revenue: '₹0'
}];
const FILTERS = ['All', 'Live', 'In review', 'Approved', 'Draft', 'Rejected'];
const FILTER_MAP = {
  All: null,
  Live: 'live',
  'In review': 'review',
  Approved: 'approved',
  Draft: 'draft',
  Rejected: 'rejected'
};

/** MyEvents — organiser's event list with status filters, search, edit/view actions. */
function MyEvents({
  onOpenEvent,
  onEditEvent,
  onCreateEvent
}) {
  const [filter, setFilter] = React.useState('All');
  const [query, setQuery] = React.useState('');
  const rows = EVENTS.filter(e => {
    const matchesFilter = !FILTER_MAP[filter] || e.status === FILTER_MAP[filter];
    const matchesQuery = e.title.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, "My events"), /*#__PURE__*/React.createElement(Button, {
    onClick: onCreateEvent
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 16
  }), "Create event")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, FILTERS.map(f => /*#__PURE__*/React.createElement("button", {
    key: f,
    onClick: () => setFilter(f),
    style: {
      padding: '7px 16px',
      borderRadius: 'var(--radius-pill)',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      border: `1px solid ${filter === f ? 'var(--color-accent)' : 'var(--border-default)'}`,
      background: filter === f ? 'var(--color-accent-tint)' : 'var(--surface-card)',
      color: filter === f ? 'var(--color-accent)' : 'var(--text-body)'
    }
  }, f))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 260
    }
  }, /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    placeholder: "Search your events",
    value: query,
    onChange: e => setQuery(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)'
    }
  }, rows.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "calendar-x",
    title: "No events match",
    description: "Try a different filter or search term."
  }) : /*#__PURE__*/React.createElement(DataTable, {
    columns: [{
      key: 'title',
      label: 'Event',
      render: r => /*#__PURE__*/React.createElement("div", {
        onClick: () => onOpenEvent && onOpenEvent(r),
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          width: 44,
          height: 44,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #EFEAE4, #E4DED6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-subtle)',
          flex: 'none'
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "image",
        size: 16
      })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        style: {
          fontWeight: 700,
          color: 'var(--text-heading)'
        }
      }, r.title), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12.5,
          color: 'var(--text-muted)',
          marginTop: 2
        }
      }, r.date, " \xB7 ", r.city)))
    }, {
      key: 'status',
      label: 'Status',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        status: r.status
      })
    }, {
      key: 'registrations',
      label: 'Registrations'
    }, {
      key: 'revenue',
      label: 'Revenue'
    }],
    rows: rows,
    actions: {
      onClick: r => onEditEvent && onEditEvent(r)
    }
  })));
}
window.MyEvents = MyEvents;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/organiser-portal/MyEvents.jsx", error: String((e && e.message) || e) }); }

// ui_kits/organiser-portal/OrganiserDashboard.jsx
try { (() => {
const {
  Icon,
  StatCard,
  Badge,
  Button
} = window.CyRokxDesignSystem_ef2ebf;
const ACTIVITY = [{
  icon: 'ticket',
  text: 'New registration for Jazz Night at The Terrace',
  time: '12 min ago'
}, {
  icon: 'check-circle',
  text: 'Street Food Fest was approved by the admin team',
  time: '2 hours ago'
}, {
  icon: 'ticket',
  text: '3 tickets sold for Watercolour Workshop',
  time: '5 hours ago'
}, {
  icon: 'alert-circle',
  text: 'Indie Rock Live was rejected — venue capacity missing',
  time: 'Yesterday'
}, {
  icon: 'ticket',
  text: '12 tickets sold for Jazz Night at The Terrace',
  time: 'Yesterday'
}];
const EVENTS_SNAPSHOT = [{
  title: 'Jazz Night at The Terrace',
  status: 'live',
  date: 'Sat, 12 Jul',
  registrations: 214
}, {
  title: 'Watercolour Workshop',
  status: 'live',
  date: 'Sat, 19 Jul',
  registrations: 38
}, {
  title: 'Street Food Fest',
  status: 'approved',
  date: 'Fri, 25 Jul',
  registrations: 0
}, {
  title: 'Indie Rock Live',
  status: 'rejected',
  date: 'Thu, 17 Jul',
  registrations: 0
}];

/** Dashboard — organiser home: stat cards, recent activity, quick action to create an event. */
function OrganiserDashboard({
  onCreateEvent,
  onOpenEvent
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, "Good afternoon, Aditi"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)',
      marginTop: 4
    }
  }, "Here's how Terrace Live Events is doing.")), /*#__PURE__*/React.createElement(Button, {
    onClick: onCreateEvent
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 16
  }), "Create event")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 20,
      marginBottom: 32
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Active events",
    value: "4",
    delta: "+1 this month",
    icon: "calendar"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Total registrations",
    value: "1,204",
    delta: "+12% vs last week",
    icon: "users"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Revenue",
    value: "\u20B94.2L",
    delta: "+8% vs last week",
    icon: "indian-rupee"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.3fr 1fr',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, "Your events"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-link)',
      textDecoration: 'none'
    }
  }, "View all \u2192")), /*#__PURE__*/React.createElement("div", null, EVENTS_SNAPSHOT.map(e => /*#__PURE__*/React.createElement("div", {
    key: e.title,
    onClick: () => onOpenEvent && onOpenEvent(e),
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 0',
      borderBottom: '1px solid var(--border-default)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: 'var(--text-heading)'
    }
  }, e.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, e.date, " \xB7 ", e.registrations, " registrations")), /*#__PURE__*/React.createElement(Badge, {
    status: e.status
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginBottom: 16
    }
  }, "Recent activity"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, ACTIVITY.map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: '50%',
      background: 'var(--color-off-white)',
      color: 'var(--text-muted)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: a.icon,
    size: 14
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--text-body)',
      lineHeight: 1.4
    }
  }, a.text), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-subtle)',
      marginTop: 2
    }
  }, a.time))))))));
}
window.OrganiserDashboard = OrganiserDashboard;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/organiser-portal/OrganiserDashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/organiser-portal/OrganiserEventDetail.jsx
try { (() => {
const {
  Icon,
  Badge,
  StatCard,
  Button
} = window.CyRokxDesignSystem_ef2ebf;
const GROUPS = [{
  name: 'Overview',
  tabs: [{
    key: 'dashboard',
    label: 'Dashboard'
  }]
}, {
  name: 'Registration',
  tabs: [{
    key: 'categories',
    label: 'Categories'
  }, {
    key: 'regform',
    label: 'Registration form'
  }, {
    key: 'discounts',
    label: 'Discounts'
  }, {
    key: 'tax',
    label: 'Tax'
  }]
}, {
  name: 'People',
  tabs: [{
    key: 'orders',
    label: 'Orders'
  }]
}];
const OVERFLOW = [{
  key: 'attendees',
  label: 'Attendees',
  icon: 'users'
}, {
  key: 'edit',
  label: 'Edit event',
  icon: 'pencil'
}, {
  key: 'merch',
  label: 'Merchandize',
  icon: 'shopping-bag'
}, {
  key: 'leaderboards',
  label: 'Leaderboards',
  icon: 'trophy'
}, {
  key: 'certificates',
  label: 'Certificates',
  icon: 'award'
}, {
  key: 'bib',
  label: 'Attendee bib',
  icon: 'hash'
}, {
  key: 'email',
  label: 'Email templates',
  icon: 'mail'
}];
const OVERFLOW_LABEL = Object.fromEntries(OVERFLOW.map(o => [o.key, o.label]));
const ORDERS_SERIES = [{
  d: '02',
  v: 12
}, {
  d: '03',
  v: 5
}, {
  d: '04',
  v: 3
}, {
  d: '05',
  v: 4
}, {
  d: '06',
  v: 7
}, {
  d: '07',
  v: 3
}, {
  d: '08',
  v: 8
}, {
  d: '09',
  v: 10
}, {
  d: '10',
  v: 29
}, {
  d: '11',
  v: 3
}, {
  d: '12',
  v: 5
}, {
  d: '13',
  v: 12
}, {
  d: '14',
  v: 5
}, {
  d: '15',
  v: 2
}];

/** OrganiserEventDetail — the event workspace: grouped tab navigation with an overflow menu
 *  fronting the 13 event-management surfaces, plus the dashboard (status/balance/orders/attendees
 *  + orders-by-date) and routing into Categories, Registration form, Discounts, Tax, Orders, Attendees. */
function OrganiserEventDetail({
  event,
  onEdit,
  onViewAttendees,
  onBack
}) {
  const [tab, setTab] = React.useState('dashboard');
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const title = event?.title || 'RunXtreme Half Marathon 2026';
  const unlisted = event?.unlisted;
  const shareUrl = 'cyrokx.in/e/runxtreme-half-marathon-2026?k=8fa2';
  const moreSelected = OVERFLOW.some(o => o.key === tab);
  const moreActive = moreSelected && tab !== 'attendees';
  const copy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return /*#__PURE__*/React.createElement("div", {
    onClick: () => moreOpen && setMoreOpen(false)
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      background: 'none',
      border: 'none',
      color: 'var(--text-muted)',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      marginBottom: 16,
      padding: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-left",
    size: 15
  }), " My events"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 22,
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, title), /*#__PURE__*/React.createElement(Badge, {
    status: "live"
  }, "Published"), unlisted && /*#__PURE__*/React.createElement(Badge, {
    status: "draft"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "eye-off",
    size: 12
  }), "Unlisted")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)',
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar",
    size: 14
  }), " Sun, 26 Jul \xB7 5:00 AM", /*#__PURE__*/React.createElement("span", {
    style: {
      margin: '0 2px'
    }
  }, "\xB7"), /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 14
  }), " Cubbon Park, Bengaluru")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    onClick: copy
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "link",
    size: 15
  }), copied ? 'Link copied' : 'Copy registration link'), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: onEdit
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pencil",
    size: 15
  }), "Edit event"))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'stretch',
      gap: 0,
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-card)',
      padding: '4px 6px',
      marginBottom: 28,
      boxShadow: 'var(--shadow-card)'
    }
  }, GROUPS.map((g, gi) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: g.name
  }, gi > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      background: 'var(--border-default)',
      margin: '8px 6px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 2
    }
  }, g.tabs.map(t => /*#__PURE__*/React.createElement(TabButton, {
    key: t.key,
    active: tab === t.key,
    onClick: () => setTab(t.key)
  }, t.label))))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement(TabButton, {
    active: moreSelected,
    onClick: () => setMoreOpen(v => !v)
  }, moreSelected ? OVERFLOW_LABEL[tab] : 'More', " ", /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 14
  })), moreOpen && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: '100%',
      right: 0,
      marginTop: 6,
      width: 220,
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-modal, 0 12px 32px rgba(0,0,0,0.14))',
      padding: 6,
      zIndex: 20
    }
  }, OVERFLOW.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.key,
    onClick: () => {
      setTab(o.key);
      setMoreOpen(false);
    },
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      textAlign: 'left',
      background: tab === o.key ? 'var(--surface-accent-tint)' : 'none',
      border: 'none',
      borderRadius: 'var(--radius-control)',
      padding: '9px 10px',
      fontSize: 13.5,
      fontWeight: 600,
      color: tab === o.key ? 'var(--color-accent)' : 'var(--text-body)',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: o.icon,
    size: 15
  }), o.label))))), tab === 'dashboard' && /*#__PURE__*/React.createElement(Dashboard, null), tab === 'categories' && /*#__PURE__*/React.createElement(window.EventCategories, null), tab === 'regform' && /*#__PURE__*/React.createElement(window.EventRegistrationForm, null), tab === 'discounts' && /*#__PURE__*/React.createElement(window.EventDiscounts, null), tab === 'tax' && /*#__PURE__*/React.createElement(window.EventTax, null), tab === 'orders' && /*#__PURE__*/React.createElement(window.EventOrders, null), tab === 'attendees' && /*#__PURE__*/React.createElement(window.AttendeeList, {
    onBack: () => setTab('dashboard'),
    embedded: true
  }), moreActive && tab !== 'attendees' && /*#__PURE__*/React.createElement(ComingSoon, {
    label: OVERFLOW_LABEL[tab],
    icon: (OVERFLOW.find(o => o.key === tab) || {}).icon,
    onEdit: onEdit,
    tab: tab
  }));
}
function TabButton({
  active,
  onClick,
  children
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: active ? 'var(--color-accent)' : 'none',
      color: active ? '#fff' : 'var(--text-body)',
      border: 'none',
      borderRadius: 'var(--radius-control)',
      padding: '8px 14px',
      fontSize: 13.5,
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      whiteSpace: 'nowrap'
    }
  }, children);
}
function Dashboard() {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 20,
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'linear-gradient(135deg, var(--color-accent-secondary), color-mix(in srgb, var(--color-accent-secondary) 78%, black))',
      borderRadius: 'var(--radius-card)',
      padding: 22,
      color: '#fff',
      boxShadow: 'var(--shadow-card)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      opacity: 0.85
    }
  }, "Status"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      fontWeight: 700,
      marginTop: 6
    }
  }, "Published")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      padding: 22,
      boxShadow: 'var(--shadow-card)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: 'var(--text-subtle)'
    }
  }, "Balance"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginTop: 6
    }
  }, "\u20B90.00"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 12.5,
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Payable"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, "\u20B963,000.00")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 3
    }
  }, /*#__PURE__*/React.createElement("span", null, "Paid"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      color: 'var(--color-success)'
    }
  }, "\u20B963,000.00")))), /*#__PURE__*/React.createElement(StatCard, {
    label: "Orders",
    value: "108",
    delta: "+12 this week",
    icon: "receipt"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Attendees",
    value: "126",
    delta: "+14 this week",
    icon: "users"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginBottom: 18
    }
  }, "Orders by date"), /*#__PURE__*/React.createElement(OrdersChart, null)));
}
function OrdersChart() {
  const W = 1120,
    H = 300,
    pad = {
      l: 34,
      r: 12,
      t: 12,
      b: 28
    };
  const data = ORDERS_SERIES;
  const max = 30;
  const iw = W - pad.l - pad.r,
    ih = H - pad.t - pad.b;
  const x = i => pad.l + i / (data.length - 1) * iw;
  const y = v => pad.t + ih - v / max * ih;
  const pts = data.map((p, i) => [x(i), y(p.v)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${x(data.length - 1).toFixed(1)},${y(0)} L${pad.l},${y(0)} Z`;
  const ticks = [0, 5, 10, 15, 20, 25, 30];
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${H}`,
    style: {
      width: '100%',
      height: 'auto',
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "ordFill",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0",
    stopColor: "var(--color-accent-secondary)",
    stopOpacity: "0.28"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "1",
    stopColor: "var(--color-accent-secondary)",
    stopOpacity: "0.02"
  }))), ticks.map(t => /*#__PURE__*/React.createElement("g", {
    key: t
  }, /*#__PURE__*/React.createElement("line", {
    x1: pad.l,
    x2: W - pad.r,
    y1: y(t),
    y2: y(t),
    stroke: "var(--border-default)",
    strokeWidth: "1"
  }), /*#__PURE__*/React.createElement("text", {
    x: pad.l - 8,
    y: y(t) + 4,
    textAnchor: "end",
    fontSize: "11",
    fill: "var(--text-subtle)",
    fontFamily: "var(--font-sans)"
  }, t))), /*#__PURE__*/React.createElement("path", {
    d: area,
    fill: "url(#ordFill)"
  }), /*#__PURE__*/React.createElement("path", {
    d: line,
    fill: "none",
    stroke: "var(--color-accent-secondary)",
    strokeWidth: "2.5",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }), pts.map((p, i) => /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: p[0],
    cy: p[1],
    r: data[i].v === max ? 4.5 : 3,
    fill: "#fff",
    stroke: "var(--color-accent-secondary)",
    strokeWidth: "2"
  })), data.map((p, i) => /*#__PURE__*/React.createElement("text", {
    key: i,
    x: x(i),
    y: H - 8,
    textAnchor: "middle",
    fontSize: "11",
    fill: "var(--text-subtle)",
    fontFamily: "var(--font-sans)"
  }, p.d, "-Jul")));
}
function ComingSoon({
  label,
  icon,
  onEdit,
  tab
}) {
  if (tab === 'edit') {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        padding: 48,
        textAlign: 'center',
        maxWidth: 520,
        margin: '0 auto'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: 'var(--surface-accent-tint)',
        color: 'var(--color-accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "pencil",
      size: 24
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        fontWeight: 700,
        color: 'var(--text-heading)',
        marginBottom: 6
      }
    }, "Edit event details"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        color: 'var(--text-muted)',
        marginBottom: 20,
        lineHeight: 1.5
      }
    }, "Reopens the create-event flow pre-filled with this event's details, schedule, categories and fees."), /*#__PURE__*/React.createElement(Button, {
      onClick: onEdit
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "pencil",
      size: 15
    }), "Open editor"));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: 48,
      textAlign: 'center',
      maxWidth: 520,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: '50%',
      background: 'var(--color-off-white)',
      color: 'var(--text-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 16px'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon || 'sparkles',
    size: 24
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginBottom: 6
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)',
      lineHeight: 1.5
    }
  }, "This surface is on the roadmap and not yet designed. It lives in the event navigation so the full 13-tab structure is visible for review."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    status: "review"
  }, "In design queue")));
}
window.OrganiserEventDetail = OrganiserEventDetail;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/organiser-portal/OrganiserEventDetail.jsx", error: String((e && e.message) || e) }); }

// ui_kits/public-site/CategoryPage.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Icon,
  EventCard,
  FilterControl,
  Checkbox,
  Select,
  EmptyState
} = window.CyRokxDesignSystem_ef2ebf;
const CATEGORY_META = {
  Music: {
    icon: 'music',
    description: 'Live gigs, concerts and jam nights near you.'
  },
  Comedy: {
    icon: 'mic-2',
    description: 'Stand-up, improv and open mic nights.'
  },
  Workshops: {
    icon: 'pencil',
    description: 'Hands-on sessions taught by working practitioners.'
  },
  Sports: {
    icon: 'trophy',
    description: 'Matches, runs and fan meet-ups.'
  }
};
const RESULTS = [{
  title: 'Jazz Night at The Terrace',
  date: 'Sat, 12 Jul',
  city: 'Mumbai',
  priceFrom: '₹799',
  category: 'Music'
}, {
  title: 'Indie Rock Live',
  date: 'Thu, 17 Jul',
  city: 'Pune',
  priceFrom: '₹599',
  category: 'Music'
}, {
  title: 'Classical Evening',
  date: 'Fri, 25 Jul',
  city: 'Chennai',
  priceFrom: '₹899',
  category: 'Music'
}, {
  title: 'Acoustic Sundays',
  date: 'Sun, 20 Jul',
  city: 'Bengaluru',
  priceFrom: '₹449',
  category: 'Music'
}, {
  title: 'Rooftop DJ Set',
  date: 'Sat, 26 Jul',
  city: 'Delhi',
  priceFrom: '₹999',
  category: 'Music',
  soldOut: true
}, {
  title: 'Open Mic Nights',
  date: 'Wed, 16 Jul',
  city: 'Mumbai',
  priceFrom: 'Free',
  category: 'Music'
}];

/** CategoryPage — category header (icon, name, description, count), filtered grid with city/date/price sidebar. */
function CategoryPage({
  category = 'Music',
  onOpenEvent,
  onBackHome
}) {
  const meta = CATEGORY_META[category] || CATEGORY_META.Music;
  const [showEmpty, setShowEmpty] = React.useState(false);
  const results = showEmpty ? [] : RESULTS;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      maxWidth: 'var(--content-max-width)',
      margin: '0 auto',
      padding: '32px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-subtle)',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onBackHome && onBackHome();
    },
    style: {
      color: 'var(--text-subtle)',
      textDecoration: 'none'
    }
  }, "Home"), ' / ', /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)'
    }
  }, category)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16,
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: 'var(--radius-card)',
      background: 'var(--color-accent-tint)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: meta.icon,
    size: 26,
    color: "var(--color-accent)"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 28,
      fontWeight: 700,
      color: 'var(--text-heading)',
      margin: '0 0 4px'
    }
  }, category), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)'
    }
  }, meta.description))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '240px 1fr',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("aside", null, /*#__PURE__*/React.createElement(FilterControl, {
    title: "City",
    icon: "map-pin"
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "Mumbai",
    checked: true
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Delhi"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Bengaluru"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Pune"
  })), /*#__PURE__*/React.createElement(FilterControl, {
    title: "Date",
    icon: "calendar",
    defaultOpen: false
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "Today"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "This weekend"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Next 30 days"
  })), /*#__PURE__*/React.createElement(FilterControl, {
    title: "Price",
    icon: "tag",
    defaultOpen: false
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "Free"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Under \u20B9500"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "\u20B9500\u20131,500"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowEmpty(!showEmpty),
    style: {
      marginTop: 16,
      fontSize: 12,
      color: 'var(--text-subtle)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      textDecoration: 'underline'
    }
  }, showEmpty ? 'Show results' : 'Preview empty state')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)'
    }
  }, results.length, " events found"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 200
    }
  }, /*#__PURE__*/React.createElement(Select, {
    placeholder: "Sort: Recommended",
    options: ['Date: soonest', 'Price: low to high', 'Price: high to low']
  }))), results.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "calendar-x",
    title: `No upcoming ${category.toLowerCase()} events`,
    description: "Check back soon, or explore another category."
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 20
    }
  }, results.map(e => /*#__PURE__*/React.createElement(EventCard, _extends({
    key: e.title
  }, e, {
    onClick: () => onOpenEvent && onOpenEvent(e)
  })))))));
}
window.CategoryPage = CategoryPage;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/public-site/CategoryPage.jsx", error: String((e && e.message) || e) }); }

// ui_kits/public-site/Checkout.jsx
try { (() => {
const {
  Icon,
  Input,
  Button
} = window.CyRokxDesignSystem_ef2ebf;

/** Checkout — ticket summary, buyer details form, order summary, pay button, trust markers. No login. */
function Checkout({
  total = 899,
  onPay
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      maxWidth: 900,
      margin: '0 auto',
      padding: '32px'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 28,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginBottom: 24
    }
  }, "Checkout"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginBottom: 14
    }
  }, "Buyer details"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Full name",
    placeholder: "Priya Shah"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Email",
    type: "email",
    placeholder: "you@email.com"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Phone",
    type: "tel",
    placeholder: "+91 98765 43210"
  })), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginBottom: 14
    }
  }, "Payment"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Card number",
    placeholder: "1234 1234 1234 1234",
    icon: "credit-card"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Expiry",
    placeholder: "MM/YY"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "CVV",
    placeholder: "123"
  })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--text-heading)',
      margin: '0 0 14px'
    }
  }, "Order summary"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-body)',
      marginBottom: 10,
      fontWeight: 600
    }
  }, "Jazz Night at The Terrace"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 14,
      color: 'var(--text-muted)',
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", null, "Standard \xD7 1"), /*#__PURE__*/React.createElement("span", null, "\u20B9899")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 14,
      color: 'var(--text-muted)',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", null, "Booking fee"), /*#__PURE__*/React.createElement("span", null, "\u20B90")), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--border-default)',
      paddingTop: 14,
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, "Total"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 20,
      color: 'var(--color-accent)'
    }
  }, "\u20B9", total.toLocaleString('en-IN'))), /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    size: "lg",
    onClick: () => onPay && onPay()
  }, "Pay \u20B9", total.toLocaleString('en-IN')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 12,
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield-check",
    size: 14
  }), " Secure checkout, no account needed"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 12,
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "lock",
    size: 14
  }), " Payment details are encrypted"))))));
}
window.Checkout = Checkout;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/public-site/Checkout.jsx", error: String((e && e.message) || e) }); }

// ui_kits/public-site/CityPage.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Icon,
  EventCard,
  Tag,
  Select,
  EmptyState
} = window.CyRokxDesignSystem_ef2ebf;
const CATEGORIES = ['All', 'Music', 'Comedy', 'Workshops', 'Sports', 'Food & Drink'];
const RESULTS = [{
  title: 'Jazz Night at The Terrace',
  date: 'Sat, 12 Jul',
  city: 'Mumbai',
  priceFrom: '₹799',
  category: 'Music'
}, {
  title: 'Street Food Fest',
  date: 'Fri, 25 Jul',
  city: 'Mumbai',
  priceFrom: '₹299',
  category: 'Food & Drink',
  soldOut: true
}, {
  title: 'Marathon Expo',
  date: 'Sun, 20 Jul',
  city: 'Mumbai',
  priceFrom: 'Free',
  category: 'Sports'
}, {
  title: 'Open Mic Nights',
  date: 'Wed, 16 Jul',
  city: 'Mumbai',
  priceFrom: 'Free',
  category: 'Music'
}, {
  title: 'Watercolour Workshop',
  date: 'Sat, 19 Jul',
  city: 'Mumbai',
  priceFrom: '₹1,200',
  category: 'Workshops'
}, {
  title: 'Improv Comedy Jam',
  date: 'Sat, 19 Jul',
  city: 'Mumbai',
  priceFrom: '₹399',
  category: 'Comedy'
}];

/** CityPage — city header, quick category tags, filtered grid. */
function CityPage({
  city = 'Mumbai',
  onOpenEvent,
  onBackHome
}) {
  const [active, setActive] = React.useState('All');
  const results = active === 'All' ? RESULTS : RESULTS.filter(e => e.category === active);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '56px 32px',
      background: 'var(--color-ink)',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--content-max-width)',
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.55)',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onBackHome && onBackHome();
    },
    style: {
      color: 'rgba(255,255,255,0.55)',
      textDecoration: 'none'
    }
  }, "Home"), ' / ', /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'rgba(255,255,255,0.8)'
    }
  }, city)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 22,
    color: "var(--color-accent)"
  }), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 36,
      fontWeight: 700,
      margin: 0
    }
  }, "Events in ", city)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      color: 'rgba(255,255,255,0.65)'
    }
  }, RESULTS.length, " events happening across ", city))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--content-max-width)',
      margin: '0 auto',
      padding: '32px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
      flexWrap: 'wrap',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, CATEGORIES.map(c => /*#__PURE__*/React.createElement(Tag, {
    key: c,
    active: active === c,
    onClick: () => setActive(c)
  }, c))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 200
    }
  }, /*#__PURE__*/React.createElement(Select, {
    placeholder: "Sort: Recommended",
    options: ['Date: soonest', 'Price: low to high', 'Price: high to low']
  }))), results.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "map-pin",
    title: `No ${active.toLowerCase()} events in ${city} right now`,
    description: "Try another category or check back soon."
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 20
    }
  }, results.map(e => /*#__PURE__*/React.createElement(EventCard, _extends({
    key: e.title
  }, e, {
    onClick: () => onOpenEvent && onOpenEvent(e)
  }))))));
}
window.CityPage = CityPage;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/public-site/CityPage.jsx", error: String((e && e.message) || e) }); }

// ui_kits/public-site/ErrorStates.jsx
try { (() => {
const {
  Icon,
  Button,
  EmptyState
} = window.CyRokxDesignSystem_ef2ebf;
const TABS = [{
  key: 'notfound',
  label: '404'
}, {
  key: 'empty',
  label: 'Empty search'
}, {
  key: 'paymentfail',
  label: 'Payment failed'
}];

/** ErrorStates — 404, empty search results, and payment failure with retry. Grouped as one specimen with a state switcher. */
function ErrorStates({
  onBackHome,
  onRetryPayment
}) {
  const [state, setState] = React.useState('notfound');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      maxWidth: 'var(--content-max-width)',
      margin: '0 auto',
      padding: '32px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginBottom: 40,
      justifyContent: 'center'
    }
  }, TABS.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.key,
    onClick: () => setState(t.key),
    style: {
      padding: '8px 16px',
      borderRadius: 999,
      fontSize: 13,
      fontWeight: 600,
      fontFamily: 'var(--font-sans)',
      cursor: 'pointer',
      border: state === t.key ? 'none' : '1px solid var(--border-default)',
      background: state === t.key ? 'var(--color-accent)' : 'var(--surface-card)',
      color: state === t.key ? '#fff' : 'var(--text-body)'
    }
  }, t.label))), state === 'notfound' && /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 440,
      margin: '0 auto',
      padding: '48px 0',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: '50%',
      background: 'var(--surface-muted, #F0F0F0)',
      color: 'var(--text-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "compass",
    size: 30
  })), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 28,
      fontWeight: 700,
      color: 'var(--text-heading)',
      margin: '0 0 8px'
    }
  }, "Page not found"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      color: 'var(--text-muted)',
      margin: '0 0 28px'
    }
  }, "The event or page you're looking for doesn't exist, or may have been removed."), /*#__PURE__*/React.createElement(Button, {
    onClick: () => onBackHome && onBackHome()
  }, "Back to homepage")), state === 'empty' && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '48px 0'
    }
  }, /*#__PURE__*/React.createElement(EmptyState, {
    icon: "search",
    title: "No events match your search",
    description: "Try a different keyword, or widen your date range and filters.",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => onBackHome && onBackHome()
    }, "Clear search")
  })), state === 'paymentfail' && /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 440,
      margin: '0 auto',
      padding: '48px 0',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: '50%',
      background: 'var(--status-error-bg)',
      color: 'var(--color-error)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x-circle",
    size: 30
  })), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 28,
      fontWeight: 700,
      color: 'var(--text-heading)',
      margin: '0 0 8px'
    }
  }, "Payment failed"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      color: 'var(--text-muted)',
      margin: '0 0 28px'
    }
  }, "Your card was declined. No amount was charged \u2014 your tickets are still held for 10 minutes."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => onBackHome && onBackHome()
  }, "Use a different card"), /*#__PURE__*/React.createElement(Button, {
    onClick: () => onRetryPayment && onRetryPayment()
  }, "Try again"))));
}
window.ErrorStates = ErrorStates;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/public-site/ErrorStates.jsx", error: String((e && e.message) || e) }); }

// ui_kits/public-site/EventDetail.jsx
try { (() => {
const {
  Icon,
  Avatar,
  TicketTierRow,
  Button
} = window.CyRokxDesignSystem_ef2ebf;

/** EventDetail — gallery, description, agenda, ticket tiers panel, sticky buy CTA, organiser block. */
function EventDetail({
  onBuy
}) {
  const [qty, setQty] = React.useState({
    early: 0,
    standard: 1,
    vip: 0
  });
  const total = qty.early * 599 + qty.standard * 899 + qty.vip * 2499;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      maxWidth: 'var(--content-max-width)',
      margin: '0 auto',
      padding: '32px',
      paddingBottom: 120
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: 16,
      marginBottom: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '16/9',
      borderRadius: 'var(--radius-card)',
      background: 'linear-gradient(135deg,#efeae4,#e2dcd3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "image",
    size: 36
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateRows: '1fr 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 'var(--radius-card)',
      background: 'linear-gradient(135deg,#efeae4,#e2dcd3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "image",
    size: 22
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 'var(--radius-card)',
      background: 'linear-gradient(135deg,#efeae4,#e2dcd3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "image",
    size: 22
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: 48
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--color-accent)',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      marginBottom: 8
    }
  }, "Music"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 36,
      fontWeight: 700,
      color: 'var(--text-heading)',
      margin: '0 0 16px'
    }
  }, "Jazz Night at The Terrace"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24,
      marginBottom: 28,
      fontSize: 15,
      color: 'var(--text-body)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar",
    size: 16,
    color: "var(--text-muted)"
  }), " Sat, 12 Jul \xB7 7:00 PM"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 16,
    color: "var(--text-muted)"
  }), " The Terrace, Bandra, Mumbai")), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginBottom: 10
    }
  }, "About this event"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16,
      lineHeight: 1.6,
      color: 'var(--text-body)',
      marginBottom: 28
    }
  }, "An intimate evening of live jazz with local and touring artists. Doors open at 7, first set starts at 8. Seating is first-come, general admission \u2014 arrive early for the front rows."), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginBottom: 12
    }
  }, "Agenda"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      marginBottom: 28
    }
  }, [["7:00 PM", "Doors open"], ["8:00 PM", "Opening set"], ["9:00 PM", "Headline performance"]].map(([t, l]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: 'flex',
      gap: 16,
      fontSize: 15
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 80,
      color: 'var(--text-subtle)',
      fontWeight: 600
    }
  }, t), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-body)'
    }
  }, l)))), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginBottom: 12
    }
  }, "Organiser"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Terrace Live",
    size: 44
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, "Terrace Live Events"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, "42 events hosted")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 24,
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: 'var(--text-heading)',
      margin: '0 0 8px'
    }
  }, "Tickets"), /*#__PURE__*/React.createElement(TicketTierRow, {
    name: "Early Bird",
    price: "\u20B9599",
    description: "First 100 tickets",
    remaining: 12,
    quantity: qty.early,
    onQuantityChange: v => setQty({
      ...qty,
      early: v
    })
  }), /*#__PURE__*/React.createElement(TicketTierRow, {
    name: "Standard",
    price: "\u20B9899",
    quantity: qty.standard,
    onQuantityChange: v => setQty({
      ...qty,
      standard: v
    })
  }), /*#__PURE__*/React.createElement(TicketTierRow, {
    name: "VIP",
    price: "\u20B92,499",
    available: false
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)'
    }
  }, "Total"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      color: 'var(--color-accent)'
    }
  }, "\u20B9", total.toLocaleString('en-IN'))), /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    style: {
      marginTop: 16
    },
    disabled: total === 0,
    onClick: () => onBuy && onBuy(total)
  }, "Buy tickets")))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--surface-card)',
      borderTop: '1px solid var(--border-default)',
      padding: '14px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 -4px 16px rgba(0,0,0,0.06)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, "from"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: 'var(--color-accent)'
    }
  }, "\u20B9599")), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    style: {
      whiteSpace: 'nowrap',
      flexShrink: 0
    },
    disabled: total === 0,
    onClick: () => onBuy && onBuy(total)
  }, "Buy tickets")));
}
window.EventDetail = EventDetail;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/public-site/EventDetail.jsx", error: String((e && e.message) || e) }); }

// ui_kits/public-site/EventListing.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Icon,
  EventCard,
  FilterControl,
  Checkbox,
  Select,
  EmptyState
} = window.CyRokxDesignSystem_ef2ebf;
const RESULTS = [{
  title: 'Jazz Night at The Terrace',
  date: 'Sat, 12 Jul',
  city: 'Mumbai',
  priceFrom: '₹799',
  category: 'Music'
}, {
  title: 'Stand-up Sunday',
  date: 'Sun, 13 Jul',
  city: 'Delhi',
  priceFrom: '₹499',
  category: 'Comedy'
}, {
  title: 'Watercolour Workshop',
  date: 'Sat, 19 Jul',
  city: 'Bengaluru',
  priceFrom: '₹1,200',
  category: 'Workshops'
}, {
  title: 'Indie Rock Live',
  date: 'Thu, 17 Jul',
  city: 'Pune',
  priceFrom: '₹599',
  category: 'Music'
}, {
  title: 'Improv Comedy Jam',
  date: 'Sat, 19 Jul',
  city: 'Delhi',
  priceFrom: '₹399',
  category: 'Comedy'
}, {
  title: 'Street Food Fest',
  date: 'Fri, 25 Jul',
  city: 'Mumbai',
  priceFrom: '₹299',
  category: 'Food & Drink',
  soldOut: true
}];

/** EventListing — filter sidebar, sort, result grid, pagination. Shows an empty state when filters exclude everything. */
function EventListing({
  onOpenEvent
}) {
  const [showEmpty, setShowEmpty] = React.useState(false);
  const results = showEmpty ? [] : RESULTS;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      maxWidth: 'var(--content-max-width)',
      margin: '0 auto',
      padding: '32px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 28,
      fontWeight: 700,
      color: 'var(--text-heading)',
      margin: '0 0 6px'
    }
  }, "Events in Mumbai"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)'
    }
  }, results.length, " events found")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '240px 1fr',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("aside", null, /*#__PURE__*/React.createElement(FilterControl, {
    title: "Category",
    icon: "filter"
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "Music",
    checked: true
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Comedy"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Workshops"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Sports"
  })), /*#__PURE__*/React.createElement(FilterControl, {
    title: "City",
    icon: "map-pin"
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "Mumbai",
    checked: true
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Delhi"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Bengaluru"
  })), /*#__PURE__*/React.createElement(FilterControl, {
    title: "Date",
    icon: "calendar",
    defaultOpen: false
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "Today"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "This weekend"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Next 30 days"
  })), /*#__PURE__*/React.createElement(FilterControl, {
    title: "Price",
    icon: "tag",
    defaultOpen: false
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "Free"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Under \u20B9500"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "\u20B9500\u20131,500"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowEmpty(!showEmpty),
    style: {
      marginTop: 16,
      fontSize: 12,
      color: 'var(--text-subtle)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      textDecoration: 'underline'
    }
  }, showEmpty ? 'Show results' : 'Preview empty state')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 200
    }
  }, /*#__PURE__*/React.createElement(Select, {
    placeholder: "Sort: Recommended",
    options: ['Date: soonest', 'Price: low to high', 'Price: high to low']
  }))), results.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "search",
    title: "No events match your filters",
    description: "Try widening your date range or clearing a filter."
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 20
    }
  }, results.map(e => /*#__PURE__*/React.createElement(EventCard, _extends({
    key: e.title
  }, e, {
    onClick: () => onOpenEvent && onOpenEvent(e)
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      gap: 8,
      marginTop: 40
    }
  }, [1, 2, 3].map(p => /*#__PURE__*/React.createElement("span", {
    key: p,
    style: {
      width: 36,
      height: 36,
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 14,
      fontWeight: 600,
      background: p === 1 ? 'var(--color-accent)' : 'var(--surface-card)',
      color: p === 1 ? '#fff' : 'var(--text-body)',
      border: p === 1 ? 'none' : '1px solid var(--border-default)',
      cursor: 'pointer'
    }
  }, p)), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 16
  })))))));
}
window.EventListing = EventListing;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/public-site/EventListing.jsx", error: String((e && e.message) || e) }); }

// ui_kits/public-site/Homepage.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Icon,
  Tag,
  EventCard,
  SearchBar
} = window.CyRokxDesignSystem_ef2ebf;
const CATEGORIES = [{
  name: 'Music',
  icon: 'music'
}, {
  name: 'Comedy',
  icon: 'mic-2'
}, {
  name: 'Workshops',
  icon: 'pencil'
}, {
  name: 'Sports',
  icon: 'trophy'
}, {
  name: 'Food & Drink',
  icon: 'utensils'
}, {
  name: 'Theatre',
  icon: 'drama'
}];
const FEATURED = [{
  title: 'Jazz Night at The Terrace',
  date: 'Sat, 12 Jul',
  city: 'Mumbai',
  priceFrom: '₹799',
  category: 'Music'
}, {
  title: 'Stand-up Sunday',
  date: 'Sun, 13 Jul',
  city: 'Delhi',
  priceFrom: '₹499',
  category: 'Comedy'
}, {
  title: 'Watercolour Workshop',
  date: 'Sat, 19 Jul',
  city: 'Bengaluru',
  priceFrom: '₹1,200',
  category: 'Workshops'
}, {
  title: 'Street Food Fest',
  date: 'Fri, 25 Jul',
  city: 'Mumbai',
  priceFrom: '₹299',
  category: 'Food & Drink',
  soldOut: true
}];
const TRENDING = [{
  title: 'Indie Rock Live',
  date: 'Thu, 17 Jul',
  city: 'Pune',
  priceFrom: '₹599',
  category: 'Music'
}, {
  title: 'Improv Comedy Jam',
  date: 'Sat, 19 Jul',
  city: 'Delhi',
  priceFrom: '₹399',
  category: 'Comedy'
}, {
  title: 'Marathon Expo',
  date: 'Sun, 20 Jul',
  city: 'Mumbai',
  priceFrom: 'Free',
  category: 'Sports'
}, {
  title: 'Classical Evening',
  date: 'Fri, 25 Jul',
  city: 'Chennai',
  priceFrom: '₹899',
  category: 'Music'
}];

/** Homepage — hero search, category grid, featured + trending event rows. */
function Homepage({
  onOpenEvent,
  onSearch
}) {
  const [city, setCity] = React.useState('Mumbai');
  const [keyword, setKeyword] = React.useState('');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      padding: '96px 32px 120px',
      background: 'linear-gradient(135deg, #241f1c, #3a2e28)',
      color: '#fff',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.6)',
      marginBottom: 12
    }
  }, "Discover live events near you"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 48,
      fontWeight: 700,
      lineHeight: 1.2,
      margin: '0 0 32px'
    }
  }, "Find your next night out"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(SearchBar, {
    keyword: keyword,
    onKeywordChange: e => setKeyword(e.target.value),
    location: city,
    onLocationChange: e => setCity(e.target.value),
    onSubmit: onSearch
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--content-max-width)',
      margin: '0 auto',
      padding: '48px 32px'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginBottom: 20
    }
  }, "Browse by category"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gap: 12,
      marginBottom: 56
    }
  }, CATEGORIES.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.name,
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: '20px 12px',
      textAlign: 'center',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: c.icon,
    size: 22,
    color: "var(--color-accent)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-body)',
      marginTop: 8
    }
  }, c.name)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: 'var(--text-heading)',
      margin: 0
    }
  }, "Featured events in ", city), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text-link)',
      textDecoration: 'none'
    }
  }, "See all \u2192")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 20,
      marginBottom: 56
    }
  }, FEATURED.map(e => /*#__PURE__*/React.createElement(EventCard, _extends({
    key: e.title
  }, e, {
    onClick: () => onOpenEvent && onOpenEvent(e)
  })))), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginBottom: 20
    }
  }, "Trending this week"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 20
    }
  }, TRENDING.map(e => /*#__PURE__*/React.createElement(EventCard, _extends({
    key: e.title
  }, e, {
    onClick: () => onOpenEvent && onOpenEvent(e)
  }))))));
}
window.Homepage = Homepage;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/public-site/Homepage.jsx", error: String((e && e.message) || e) }); }

// ui_kits/public-site/OrderConfirmation.jsx
try { (() => {
const {
  Icon,
  Button
} = window.CyRokxDesignSystem_ef2ebf;

/** OrderConfirmation — success state, order summary, 2-day email notice. */
function OrderConfirmation({
  onBackHome
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      maxWidth: 560,
      margin: '0 auto',
      padding: '64px 32px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: '50%',
      background: 'var(--status-success-bg)',
      color: 'var(--color-success)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check-circle",
    size: 30
  })), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 28,
      fontWeight: 700,
      color: 'var(--text-heading)',
      margin: '0 0 8px'
    }
  }, "You're going!"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      color: 'var(--text-muted)',
      margin: '0 0 32px'
    }
  }, "Order #CX-48213 confirmed."), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: 24,
      textAlign: 'left',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: 16,
      color: 'var(--text-heading)',
      marginBottom: 10
    }
  }, "Jazz Night at The Terrace"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)',
      marginBottom: 4
    }
  }, "Sat, 12 Jul \xB7 7:00 PM"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)',
      marginBottom: 16
    }
  }, "The Terrace, Bandra, Mumbai"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      borderTop: '1px solid var(--border-default)',
      paddingTop: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--text-body)'
    }
  }, "Standard \xD7 1"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, "\u20B9899"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      background: 'var(--color-accent-tint)',
      borderRadius: 'var(--radius-control)',
      padding: 14,
      marginBottom: 28,
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "mail",
    size: 16,
    color: "var(--color-accent)",
    style: {
      marginTop: 2,
      flex: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-body)'
    }
  }, "Your ticket with a QR code will arrive by email within 2 days.")), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => onBackHome && onBackHome()
  }, "Back to homepage"));
}
window.OrderConfirmation = OrderConfirmation;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/public-site/OrderConfirmation.jsx", error: String((e && e.message) || e) }); }

__ds_ns.EventCard = __ds_scope.EventCard;

__ds_ns.TicketTierRow = __ds_scope.TicketTierRow;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.FilterControl = __ds_scope.FilterControl;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.SearchBar = __ds_scope.SearchBar;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.Footer = __ds_scope.Footer;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.Navbar = __ds_scope.Navbar;

__ds_ns.SidebarShell = __ds_scope.SidebarShell;

__ds_ns.Stepper = __ds_scope.Stepper;

})();
