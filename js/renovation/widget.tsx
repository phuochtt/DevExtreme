import {
  Component,
  ComponentBindings,
  Effect,
  Event,
  InternalState,
  JSXComponent,
  Method,
  OneWay,
  Ref,
  Slot,
} from 'devextreme-generator/component_declaration/common';
import '../events/click';
import '../events/hover';

import {
  active, dxClick, focus, hover, keyboard, resize, visibility,
} from '../events/short';
import { extend } from '../core/utils/extend';
import { focusable } from '../ui/widget/selectors';
import { isFakeClickEvent } from '../events/utils/index';
import { normalizeStyleProp } from '../core/utils/style';
import BaseWidgetProps from './utils/base-props';

const getAria = (args): { [name: string]: string } => Object.keys(args).reduce((r, key) => {
  if (args[key]) {
    return {
      ...r,
      [(key === 'role' || key === 'id') ? key : `aria-${key}`]: String(args[key]),
    };
  }
  return r;
}, {});

const getCssClasses = (model: Partial<Widget> & Partial<WidgetProps>) => {
  const className = ['dx-widget'];
  const isFocusable = model.focusStateEnabled && !model.disabled;
  const isHoverable = model.hoverStateEnabled && !model.disabled;

  model.classes && className.push(model.classes);
  model.className && className.push(model.className);
  model.disabled && className.push('dx-state-disabled');
  !model.visible && className.push('dx-state-invisible');
  model.focused && isFocusable && className.push('dx-state-focused');
  model.active && className.push('dx-state-active');
  model.hovered && isHoverable && !model.active && className.push('dx-state-hover');
  model.rtlEnabled && className.push('dx-rtl');
  model.onVisibilityChange && className.push('dx-visibility-change-handler');

  return className.join(' ');
};

export const viewFunction = (viewModel: Widget) => (
  <div
    ref={viewModel.widgetRef as any}
    {...viewModel.attributes} // eslint-disable-line react/jsx-props-no-spreading
    tabIndex={viewModel.tabIndex}
    title={viewModel.props.hint}
    hidden={!viewModel.props.visible}
    className={viewModel.cssClasses}
    style={viewModel.styles}
  >
    {viewModel.props.children}
  </div>
);

@ComponentBindings()
export class WidgetProps extends BaseWidgetProps {
  @OneWay() _feedbackHideTimeout?: number = 400;

  @OneWay() _feedbackShowTimeout?: number = 30;

  @OneWay() activeStateUnit?: string;

  @OneWay() aria?: any = {};

  @Slot() children?: any;

  @OneWay() classes?: string | undefined = '';

  @OneWay() className?: string = '';

  @OneWay() name?: string = '';

  @Event() onActive?: (e: any) => any;

  @Event() onDimensionChanged?: () => any;

  @Event() onInactive?: (e: any) => any;

  @Event() onKeyboardHandled?: (args: any) => any | undefined;

  @Event() onVisibilityChange?: (args: boolean) => undefined;
}

@Component({
  defaultOptionRules: null,
  jQuery: {
    register: true,
  },
  view: viewFunction,
})

export class Widget extends JSXComponent(WidgetProps) {
  @InternalState() active = false;

  @InternalState() focused = false;

  @InternalState() hovered = false;

  @Ref()
  widgetRef!: HTMLDivElement;

  @Effect()
  accessKeyEffect() {
    const namespace = 'UIFeedback';
    const { accessKey, focusStateEnabled, disabled } = this.props;
    const isFocusable = focusStateEnabled && !disabled;
    const canBeFocusedByKey = isFocusable && accessKey;

    if (canBeFocusedByKey) {
      dxClick.on(this.widgetRef, (e) => {
        if (isFakeClickEvent(e)) {
          e.stopImmediatePropagation();
          this.focused = true;
        }
      }, { namespace });

      return () => dxClick.off(this.widgetRef, { namespace });
    }

    return undefined;
  }

  @Effect()
  activeEffect() {
    const {
      activeStateEnabled, activeStateUnit, disabled, onInactive,
      _feedbackShowTimeout, _feedbackHideTimeout, onActive,
    } = this.props;
    const selector = activeStateUnit;
    const namespace = 'UIFeedback';

    if (activeStateEnabled && !disabled) {
      active.on(this.widgetRef,
        ({ event }) => {
          this.active = true;
          onActive?.(event);
        },
        ({ event }) => {
          this.active = false;
          onInactive?.(event);
        }, {
          hideTimeout: _feedbackHideTimeout,
          namespace,
          selector,
          showTimeout: _feedbackShowTimeout,
        });

      return () => active.off(this.widgetRef, { selector, namespace });
    }

    return undefined;
  }

  @Effect()
  clickEffect() {
    const { name, onClick } = this.props;
    const namespace = name;

    if (onClick) {
      dxClick.on(this.widgetRef,
        (e) => onClick(e),
        { namespace });

      return () => dxClick.off(this.widgetRef, { namespace });
    }

    return undefined;
  }

  @Method()
  focus() {
    focus.trigger(this.widgetRef);
  }

  @Effect()
  focusEffect() {
    const { disabled, focusStateEnabled, name } = this.props;
    const namespace = `${name}Focus`;
    const isFocusable = focusStateEnabled && !disabled;

    if (isFocusable) {
      focus.on(this.widgetRef,
        (e) => { !e.isDefaultPrevented() && (this.focused = true); },
        (e) => { !e.isDefaultPrevented() && (this.focused = false); },
        {
          isFocusable: focusable,
          namespace,
        });

      return () => focus.off(this.widgetRef, { namespace });
    }

    return undefined;
  }

  @Effect()
  hoverEffect() {
    const namespace = 'UIFeedback';
    const { activeStateUnit, hoverStateEnabled, disabled } = this.props;
    const selector = activeStateUnit;
    const isHoverable = hoverStateEnabled && !disabled;

    if (isHoverable) {
      hover.on(this.widgetRef,
        () => { !this.active && (this.hovered = true); },
        () => { this.hovered = false; },
        { selector, namespace });

      return () => hover.off(this.widgetRef, { selector, namespace });
    }

    return undefined;
  }

  @Effect()
  keyboardEffect() {
    const { focusStateEnabled, onKeyDown } = this.props;

    if (focusStateEnabled || onKeyDown) {
      const id = keyboard.on(this.widgetRef, this.widgetRef, (e) => onKeyDown!(e));

      return () => keyboard.off(id);
    }

    return undefined;
  }

  @Effect()
  resizeEffect() {
    const namespace = `${this.props.name}VisibilityChange`;
    const { onDimensionChanged } = this.props;

    if (onDimensionChanged) {
      resize.on(this.widgetRef, onDimensionChanged, { namespace });

      return () => resize.off(this.widgetRef, { namespace });
    }

    return undefined;
  }

  @Effect()
  visibilityEffect() {
    const { name, onVisibilityChange } = this.props;
    const namespace = `${name}VisibilityChange`;

    if (onVisibilityChange) {
      visibility.on(this.widgetRef,
        () => onVisibilityChange!(true),
        () => onVisibilityChange!(false),
        { namespace });

      return () => visibility.off(this.widgetRef, { namespace });
    }

    return undefined;
  }

  get attributes() {
    const {
      aria,
      disabled,
      focusStateEnabled,
      visible,
    } = this.props;

    const accessKey = focusStateEnabled && !disabled && this.props.accessKey;
    return {
      ...extend({}, this.restAttributes, accessKey && { accessKey }),
      ...getAria({ ...aria, disabled, hidden: !visible }),
    };
  }

  get styles() {
    const { width, height } = this.props;
    const style = this.restAttributes.style || {};

    const computedWidth = normalizeStyleProp('width', typeof width === 'function' ? width() : width);
    const computedHeight = normalizeStyleProp('height', typeof height === 'function' ? height() : height);

    return {
      ...style,
      height: computedHeight ?? style.height,
      width: computedWidth ?? style.width,
    };
  }

  get cssClasses() {
    const {
      classes,
      className,
      disabled,
      focusStateEnabled,
      hoverStateEnabled,
      onVisibilityChange,
      rtlEnabled,
      visible,
    } = this.props;

    return getCssClasses({
      active: this.active,
      focused: this.focused,
      hovered: this.hovered,
      className,
      classes,
      disabled,
      focusStateEnabled,
      hoverStateEnabled,
      onVisibilityChange,
      rtlEnabled,
      visible,
    });
  }

  get tabIndex() {
    const { focusStateEnabled, disabled, tabIndex } = this.props;
    const isFocusable = focusStateEnabled && !disabled;

    return isFocusable ? tabIndex : undefined;
  }
}
