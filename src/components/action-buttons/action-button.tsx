import clsx from 'clsx'
import Link from 'next/link'
import type { ButtonHTMLAttributes, ComponentPropsWithoutRef } from 'react'

export type ActionButtonBaseProps = {
  withLabel?: boolean
}

type BaseProps = {
  label?: string
}

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: never }
type LinkProps = BaseProps & ComponentPropsWithoutRef<typeof Link> & { href: string }

type ActionButtonProps = ButtonProps | LinkProps

export default function ActionButton(props: ActionButtonProps) {
  if (props.href) {
    const { className, children, label, ...rest } = props
    return (
      <Link
        {...rest}
        className={clsx('group flex items-center gap-0 cursor-pointer rounded-md p-1.5 text-text-faint', className)}
      >
        {children}
        {label && (
          <span className="max-w-24 overflow-hidden whitespace-nowrap text-xs font-medium pl-1.5">
            {label}
          </span>
        )}
      </Link>
    )
  }

  const { className, children, label, ...rest } = props as ButtonProps
  return (
    <button
      {...rest}
      className={clsx('group flex items-center gap-0 cursor-pointer rounded-md p-1.5 text-text-faint', className)}
    >
      {children}
      {label && (
        <span className="max-w-24 overflow-hidden whitespace-nowrap text-xs font-medium pl-1.5">
          {label}
        </span>
      )}
    </button>
  )
}
