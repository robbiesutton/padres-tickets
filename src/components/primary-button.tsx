import { ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';

type BaseProps = {
  disabled?: boolean;
};

type AsButton = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type AsLink = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

type PrimaryButtonProps = AsButton | AsLink;

export function PrimaryButton(props: PrimaryButtonProps) {
  const { disabled, className, ...rest } = props;

  const base =
    'inline-flex h-10 items-center justify-center rounded-lg px-4 py-2.5 text-base font-medium transition-colors';
  const enabled =
    'bg-[#2c2a2b] text-white hover:bg-[#dcd7d4] hover:text-[#2c2a2b]';
  const disabledStyle =
    'bg-[#2c2a2b]/5 text-[#2c2a2b]/25 cursor-not-allowed';

  const classes = `${base} ${disabled ? disabledStyle : enabled} ${className ?? ''}`;

  if ('href' in rest && rest.href) {
    const { href, ...anchorProps } = rest as AsLink;
    return (
      <a href={href} className={classes} {...anchorProps} />
    );
  }

  return (
    <button
      className={classes}
      disabled={disabled}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    />
  );
}
