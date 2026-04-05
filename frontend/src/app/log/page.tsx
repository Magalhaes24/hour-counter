'use client'

import React, { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import TimerButton from '@/components/log/TimerButton'
import QuickLogForm from '@/components/log/QuickLogForm'
import EntryList from '@/components/log/EntryList'
import { toISODate } from '@/lib/utils'

function LogPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const paramDate = searchParams.get('date')
  const today = toISODate(new Date())
  const [selectedDate, setSelectedDate] = useState<string>(paramDate ?? today)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    router.replace(`/log?date=${date}`, { scroll: false })
  }

  const handleSuccess = () => {
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-100">Log Hours</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Record time spent on your projects.
        </p>
      </div>

      <TimerButton onSuccess={handleSuccess} />

      <div className="mt-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-800" />
        <span className="text-xs text-slate-600">or log manually</span>
        <div className="h-px flex-1 bg-slate-800" />
      </div>

      <div className="mt-4">
        <QuickLogForm
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          onSuccess={handleSuccess}
        />
      </div>

      <EntryList
        selectedDate={selectedDate}
        refreshKey={refreshKey}
      />
    </div>
  )
}

export default function LogPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-800" />
      </div>
    }>
      <LogPageInner />
    </Suspense>
  )
}
