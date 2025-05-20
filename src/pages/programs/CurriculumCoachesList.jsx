"use client"

import { Sidebar } from "../../components/ui/Sidebar"
import { Navbar } from "../../components/ui/Navbar"
import { useState, useEffect } from "react"
import axios from "axios"
import { PORT } from "../../utils/constants"
import { useNavigate, useParams } from "react-router-dom"

const CurriculumCoachesList = () => {
  const { id } = useParams() // Get programId from URL params
  const [coaches, setCoaches] = useState([])
  const [programs, setPrograms] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredCoaches, setFilteredCoaches] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentProgram, setCurrentProgram] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" })

  const [schoolTerms, setSchoolTerms] = useState([])
  const [selectedSchoolTerm, setSelectedSchoolTerm] = useState("ALL")
  const [showSummary, setShowSummary] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await axios.get(`${PORT}/programs`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        })
        setPrograms(response.data)

        // Find current program
        if (id) {
          const program = response.data.find((p) => p.id.toString() === id.toString())
          setCurrentProgram(program)
        }
      } catch (error) {
        console.error("Error fetching programs:", error)
        setError("Failed to load programs. Please try again.")
      }
    }

    const fetchSchoolTerms = async () => {
      try {
        const response = await axios.get(`${PORT}/school-terms`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        })
        setSchoolTerms(response.data)
      } catch (error) {
        console.error("Error fetching school terms:", error)
        setError("Failed to load school terms. Please try again.")
      }
    }

    fetchPrograms()
    fetchSchoolTerms()
  }, [id])

  useEffect(() => {
    const fetchCoaches = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await axios.get(`${PORT}/coaches`, {
          params: {
            filterByProgram: id,
            filterBySchoolTerm: selectedSchoolTerm !== "ALL" ? selectedSchoolTerm : undefined,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        })

        setCoaches(response.data)
        setFilteredCoaches(response.data)
      } catch (error) {
        console.error("Error fetching coaches:", error)
        setError("Failed to load coaches. Please try again.")
        setFilteredCoaches([])
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchCoaches()
    }
  }, [id, selectedSchoolTerm])

  useEffect(() => {
    const results = coaches.filter(
      (coach) =>
        coach.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coach.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coach.coachId?.toString().includes(searchQuery) ||
        coach.email?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    setFilteredCoaches(results)
  }, [searchQuery, coaches])

  // Sorting function
  const requestSort = (key) => {
    let direction = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })

    const sortedCoaches = [...filteredCoaches].sort((a, b) => {
      if (key === "name") {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase()
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase()
        if (nameA < nameB) return direction === "ascending" ? -1 : 1
        if (nameA > nameB) return direction === "ascending" ? 1 : -1
        return 0
      } else {
        if (a[key] < b[key]) return direction === "ascending" ? -1 : 1
        if (a[key] > b[key]) return direction === "ascending" ? 1 : -1
        return 0
      }
    })

    setFilteredCoaches(sortedCoaches)
  }

  // Get the current sort direction indicator
  const getSortDirectionIndicator = (key) => {
    if (sortConfig.key !== key) return ""
    return sortConfig.direction === "ascending" ? " ↑" : " ↓"
  }

  // Handle export to CSV
  const handleExportCSV = () => {
    if (filteredCoaches.length === 0) return

    // Build CSV header
    let csv = "Coach Name,Coach ID,Email,Program\n"

    // Append each coach as a CSV row
    filteredCoaches.forEach((coach) => {
      const coachName = `${coach.firstName} ${coach.lastName}`
      const coachId = coach.coachId
      const email = coach.email
      const program = currentProgram?.code || ""

      csv += `"${coachName}","${coachId}","${email}","${program}"\n`
    })

    // Create a Blob from the CSV string and create a temporary download link
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `coaches-${currentProgram?.code || "all"}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <Sidebar />

      {/* main content */}
      <div className="ml-60 bg-base-200 min-h-screen">
        <Navbar />
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-bold text-xl pl-4">
              Curriculum Coaches {currentProgram ? `- ${currentProgram.code}` : ""}
            </h1>
            <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>

          {error && (
            <div className="alert alert-error mb-4">
              <div className="flex justify-between w-full">
                <span>{error}</span>
                <button onClick={() => setError(null)}>×</button>
              </div>
            </div>
          )}

          <div className="card bg-white w-full shadow-xl">
            <div className="card-body">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                {/* Left: Search Bar */}
                <div className="relative w-full md:w-auto">
                  <input
                    type="text"
                    placeholder="Search by name, ID, or email..."
                    className="input input-bordered w-full md:w-72 pr-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      onClick={() => setSearchQuery("")}
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={handleExportCSV}
                    disabled={filteredCoaches.length === 0}
                  >
                    Export CSV
                  </button>
                  <select
                    className="select select-bordered select-sm"
                    value={selectedSchoolTerm}
                    onChange={(e) => setSelectedSchoolTerm(e.target.value)}
                  >
                    <option value="ALL">All School Terms</option>
                    {schoolTerms.map((term) => (
                      <option key={term.id} value={term.id}>
                        {term.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="loading loading-spinner loading-lg"></div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                      <thead>
                        <tr>
                          <th className="cursor-pointer hover:bg-gray-100" onClick={() => requestSort("name")}>
                            Coach Name {getSortDirectionIndicator("name")}
                          </th>
                          <th className="cursor-pointer hover:bg-gray-100" onClick={() => requestSort("coachId")}>
                            Coach No. {getSortDirectionIndicator("coachId")}
                          </th>
                          <th className="cursor-pointer hover:bg-gray-100" onClick={() => requestSort("email")}>
                            Email {getSortDirectionIndicator("email")}
                          </th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCoaches.length > 0 ? (
                          filteredCoaches.map((coach) => (
                            <tr key={coach.id} className="hover">
                              <td className="font-medium">
                                {coach.firstName} {coach.lastName}
                              </td>
                              <td>{coach.coachId}</td>
                              <td>{coach.email}</td>
                              <td className="text-right">
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => navigate(`/programs/coach-details/${coach.id}`)}
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center py-8">
                              <div className="flex flex-col items-center justify-center text-gray-500">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-12 w-12 mb-2"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                  />
                                </svg>
                                <p className="text-lg font-medium">No coaches found</p>
                                <p className="text-sm">Try adjusting your search or filters</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {filteredCoaches.length > 0 && (
                    <div className="flex justify-between items-center mt-6 text-sm text-gray-600">
                      <span>
                        Showing {filteredCoaches.length} coach{filteredCoaches.length !== 1 ? "es" : ""}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>Program:</span>
                        <span className="font-medium">{currentProgram?.code || "All"}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CurriculumCoachesList
