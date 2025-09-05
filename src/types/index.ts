// 导出所有类型定义
export * from './performance'
export * from './error'  
export * from './behavior'
export * from './alert'

// 通用类型定义
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  code?: number
}

export interface PaginationParams {
  page: number
  pageSize: number
  total?: number
}

export interface TimeRange {
  start: number
  end: number
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string
    borderColor?: string
  }[]
}