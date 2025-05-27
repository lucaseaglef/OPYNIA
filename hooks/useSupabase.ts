"use client"

import { useMemo } from "react"
import { getSupabaseClient } from "@/lib/supabaseClient"

export function useSupabase() {
  const supabase = useMemo(() => getSupabaseClient(), [])
  return supabase
}
