'use client'

const RevenueChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(item => item.revenue))
  const minValue = Math.min(...data.map(item => item.revenue))
  const range = maxValue - minValue

  return (
    <div className="h-80 p-6 flex flex-col">
      <div className="flex-1 flex items-end justify-between space-x-3">
        {data.map((item, index) => {
          const height = range > 0 ? ((item.revenue - minValue) / range) * 100 : 50
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="relative group w-full">
                <div 
                  className="bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-300 hover:from-green-600 hover:to-green-500 shadow-md hover:shadow-lg"
                  style={{ height: `${height}%`, minHeight: '20px' }}
                />
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-lg">
                  <div className="font-semibold">${item.revenue.toLocaleString()}</div>
                  <div className="text-xs text-gray-300">revenue</div>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600 font-medium">
                {item.month}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default RevenueChart
