"use client"

import { Sidebar } from "../../components/ui/Sidebar"
import { Navbar } from "../../components/ui/Navbar"
import ProgramCard from "../../components/programs/ProgramCard"
import { PORT } from "../../utils/constants"
import { useState, useEffect } from "react"
import axios from "axios"

const Program = () => {
  const [programs, setPrograms] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setIsLoading(true)
        const response = await axios.get(`${PORT}/programs`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        })

        const processedPrograms = response.data.map((program) => {
          let passed = 0
          let failed = 0

          program.students.forEach((student) => {
            const hasFailed = student.studentCourse?.some((course) => course.remark === "FAILED")

            if (hasFailed) {
              failed += 1
            } else {
              passed += 1
            }
          })

          return {
            ...program,
            gradeSummary: {
              passed,
              failed,
            },
          }
        })

        setPrograms(processedPrograms)
        setError(null)
      } catch (error) {
        console.error("Error fetching programs:", error)
        setError("Failed to load programs. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrograms()
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      {/* main content */}
      <div className="flex-1 md:ml-60 transition-all duration-300 ease-in-out">
        <Navbar />
        <div className="p-4 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="font-bold text-xl md:text-2xl">Programs</h1>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="font-semibold text-lg md:text-xl text-primary mb-6 text-center">
                School of Computer and Information Sciences
              </h2>

              {isLoading ? (
                <div className="py-10">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                  <p className="text-center mt-4 text-gray-500">Loading programs...</p>
                </div>
              ) : error ? (
                <div className="py-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                    <svg
                      className="w-8 h-8 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                  </div>
                  <p className="text-red-500 font-medium">{error}</p>
                  <button onClick={() => window.location.reload()} className="mt-4 text-blue-600 hover:underline">
                    Try Again
                  </button>
                </div>
              ) : programs.length === 0 ? (
                <div className="py-10 text-center border border-dashed rounded-lg">
                  <p className="text-gray-500">No programs found</p>
                  <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    Create Your First Program
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {programs.map((data) => (
                    <ProgramCard key={data.id} program={data} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Program
