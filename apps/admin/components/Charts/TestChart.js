'use client'

const TestChart = ({ data }) => {
  return (
    <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">Test Chart - Data: {JSON.stringify(data)}</p>
    </div>
  )
}

export default TestChart
