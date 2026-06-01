'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CopyInviteButton({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button onClick={copy} className="flex items-center gap-1 hover:text-white transition-colors">
      Código: <span className="font-mono font-bold text-white">{inviteCode}</span>
      {copied ? <Check className="w-3 h-3 text-green-300" /> : <Copy className="w-3 h-3" />}
    </button>
  )
}
