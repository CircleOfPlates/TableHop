import * as React from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import * as Tooltip from '@radix-ui/react-tooltip'
import * as Toast from '@radix-ui/react-toast'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import * as Progress from '@radix-ui/react-progress'
import * as Separator from '@radix-ui/react-separator'

export function Button({ className = '', variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' }) {
  const classes = variant === 'primary' ? 'btn btn-primary' : 'btn btn-outline'
  return <button className={`${classes} ${className}`} {...props} />
}

export function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`card ${className}`}><div className="card-body">{children}</div></div>
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />
}

export function Label(props: React.HTMLAttributes<HTMLLabelElement>) {
  return <label className="label" {...props} />
}

export function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]?.toUpperCase()).slice(0,2).join('') || '?'
  return (
    <AvatarPrimitive.Root className="inline-flex h-9 w-9 select-none items-center justify-center overflow-hidden rounded-full border bg-muted align-middle">
      <AvatarPrimitive.Fallback className="text-sm font-medium text-foreground">{initials}</AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="card p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
        <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
        {description && <Dialog.Description className="text-sm text-muted-foreground mt-1">{description}</Dialog.Description>}
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn btn-outline" onClick={() => onOpenChange(false)}>{cancelText}</button>
          <button className="btn btn-primary" onClick={onConfirm}>{confirmText}</button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  )
}

export { DropdownMenu, Dialog, Tabs, Tooltip, Toast, Progress, Separator }


