import { createClient } from '@/lib/supabase/client'

export interface ClassAverageSummary {
  classroom: string
  average: number
  students: number
  reports: number
}

export interface CalculationResult {
  success: boolean
  message: string
  calculatedAverages: number
  period: string
  summary?: ClassAverageSummary[]
  error?: string
}

type CachedAverage = {
  classroom_id: string
  average_grade: number
  total_students: number
  total_reports: number
  last_calculated: string
  period: string
}

/**
 * Manually trigger class averages calculation
 * This calls the Supabase Edge Function to calculate and store class averages
 */
export async function calculateClassAverages(): Promise<CalculationResult> {
  try {
    const supabase = createClient()
    
    console.log('🚀 Triggering class averages calculation...')
    
    const { data, error } = await supabase.functions.invoke('calculate-class-averages', {
      body: {}
    })

    if (error) {
      console.error('❌ Error calling Edge Function:', error)
      return {
        success: false,
        message: 'Failed to trigger calculation',
        calculatedAverages: 0,
        period: '',
        error: error.message
      }
    }

    console.log('✅ Class averages calculation completed:', data)
    return data as CalculationResult

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return {
      success: false,
      message: 'Unexpected error occurred',
      calculatedAverages: 0,
      period: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get the latest class averages from MongoDB
 * This fetches the calculated averages from the Edge Function
 */
export async function getClassAverages(period?: string): Promise<ClassAverageSummary[]> {
  try {
    const supabase = createClient()
    
    // Call Edge Function to get averages
    const { data, error } = await supabase.functions.invoke('get-class-averages', {
      body: { period }
    })

    if (error) {
      console.error('❌ Error fetching class averages:', error)
      return []
    }

    return data?.averages || []

  } catch (error) {
    console.error('❌ Unexpected error fetching averages:', error)
    return []
  }
}

/**
 * Get class averages from Supabase cache (faster than MongoDB)
 * Returns empty array if cache table doesn't exist
 */
export async function getClassAveragesFromCache(): Promise<CachedAverage[]> {
  try {
    console.log('📋 Skipping cache table lookup - table not yet created')
    // For now, return empty array since cache table doesn't exist
    // The main calculation will still work via Edge Function
    return []

  } catch (error) {
    console.error('❌ Unexpected error fetching cached averages:', error)
    return []
  }
}