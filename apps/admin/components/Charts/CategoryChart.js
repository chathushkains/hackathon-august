'use client'

const CategoryChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']
  const total = data.reduce((sum, item) => sum + item.value, 0)

  // Calculate percentages with proper rounding
  const dataWithPercentages = data.map(item => ({
    ...item,
    percentage: total > 0 ? (item.value / total) * 100 : 0
  }))

  // Adjust percentages to ensure they sum to 100%
  const totalPercentage = dataWithPercentages.reduce((sum, item) => sum + item.percentage, 0)
  const adjustment = 100 - totalPercentage
  if (Math.abs(adjustment) > 0.1) {
    // Find the largest item and adjust it
    const largestIndex = dataWithPercentages.reduce((maxIndex, item, index) => 
      item.percentage > dataWithPercentages[maxIndex].percentage ? index : maxIndex, 0
    )
    dataWithPercentages[largestIndex].percentage += adjustment
  }

  return (
    <div className="h-80 p-6 flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-56 h-56">
          {/* Pie Chart using CSS */}
          <div className="relative w-full h-full rounded-full overflow-hidden shadow-lg">
            {dataWithPercentages.map((item, index) => {
              const percentage = item.percentage
              const rotation = dataWithPercentages.slice(0, index).reduce((acc, prev) => acc + prev.percentage * 3.6, 0)
              
              return (
                <div
                  key={index}
                  className="absolute inset-0"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                  }}
                >
                  <div
                    className="w-full h-full origin-center transition-all duration-300 hover:scale-105"
                    style={{
                      background: `conic-gradient(from 0deg, ${COLORS[index % COLORS.length]} 0deg ${percentage * 3.6}deg, transparent ${percentage * 3.6}deg)`,
                    }}
                  />
                </div>
              )
            })}
          </div>
          
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{total}</div>
              <div className="text-sm text-gray-500 font-medium">Total</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 grid grid-cols-1 gap-3">
        {dataWithPercentages.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full shadow-sm" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm font-medium text-gray-700">
                {item.name}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {item.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CategoryChart
