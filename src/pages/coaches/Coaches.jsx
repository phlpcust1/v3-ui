"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import axios from "axios"
import { Navbar } from "../../components/ui/Navbar"
import { Sidebar } from "../../components/ui/Sidebar"
import { PORT } from "../../utils/constants"

export function Coaches() {
  const [coaches, setCoaches] = useState([])
  const [programs, setPrograms] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [csvFile, setCsvFile] = useState(null)
  const [selectedCoach, setSelectedCoach] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortField, setSortField] = useState("lastName")
  const [sortDirection, setSortDirection] = useState("asc")
  const [csvFormat, setCsvFormat] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm()

  const fetchCoaches = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await axios.get(`${PORT}/coaches`, {
        params: { q: searchQuery },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      // Sort coaches
      const sortedCoaches = [...response.data].sort((a, b) => {
        const valueA = a[sortField]
        const valueB = b[sortField]

        if (sortDirection === "asc") {
          return valueA > valueB ? 1 : -1
        } else {
          return valueA < valueB ? 1 : -1
        }
      })

      setCoaches(sortedCoaches)
      setTotalPages(Math.ceil(sortedCoaches.length / itemsPerPage))
    } catch (error) {
      console.error("Error fetching coaches:", error)
      setError("Failed to load coaches. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPrograms = async () => {
    try {
      const response = await axios.get(`${PORT}/programs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      setPrograms(response.data)
    } catch (error) {
      console.error("Error fetching programs:", error)
    }
  }

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        programId: Number.parseInt(data.programId),
        password: "password",
      }

      if (selectedCoach) {
        await axios.patch(`${PORT}/coaches/${selectedCoach.id}`, payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        })
      } else {
        await axios.post(`${PORT}/coaches`, payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        })
      }

      setIsModalOpen(false)
      setIsViewModalOpen(false)
      reset()
      fetchCoaches()
    } catch (error) {
      console.error("Error saving coach:", error)
      setError("Failed to save coach. Please try again.")
    }
  }

  const handleDelete = async (coachId) => {
    try {
      const confirmed = window.confirm("Are you sure you want to delete this coach?")
      if (!confirmed) return

      await axios.delete(`${PORT}/coaches/${coachId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      fetchCoaches()
    } catch (error) {
      console.error("Error deleting coach:", error)
      setError("Failed to delete coach. Please try again.")
    }
  }

  const handleViewDetails = async (coach) => {
    try {
      const response = await axios.get(`${PORT}/coaches/${coach.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      const coachData = response.data

      setSelectedCoach(coachData)
      setIsViewModalOpen(true)

      // Populate form fields with coach data
      for (const [key, value] of Object.entries(coachData)) {
        setValue(key, value)
      }
    } catch (error) {
      console.error("Error fetching coach details:", error)
      setError("Failed to load coach details. Please try again.")
    }
  }

  const handleUpload = async () => {
    if (!csvFile) {
      setError("Please select a file to upload")
      return
    }

    const formData = new FormData()
    formData.append("file", csvFile)

    try {
      await axios.post(`${PORT}/coaches/upload`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "multipart/form-data",
        },
      })
      setIsUploadModalOpen(false)
      setCsvFile(null)
      fetchCoaches()
    } catch (error) {
      console.error("Error uploading file:", error)
      setError("Failed to upload file. Please check the format and try again.")
    }
  }

  const handleDownloadCsv = () => {
    if (coaches.length === 0) {
      setError("No coaches to download")
      return
    }

    // Build CSV header
    let csv = "Coach Name,Coach ID,Email,Program\n"

    // Append each coach as a CSV row
    coaches.forEach((coach) => {
      const coachName = `${coach.firstName} ${coach.lastName}`
      const coachId = coach.coachId
      const email = coach.email
      const program = programs.find((p) => p.id === coach.programId)?.code || ""

      csv += `"${coachName}","${coachId}","${email}","${program}"\n`
    })

    // Create a Blob from the CSV string and create a temporary download link
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "coaches.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleAddCoach = () => {
    setSelectedCoach(null)
    reset()
    setIsModalOpen(true)
  }

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  // Get current coaches for pagination
  const indexOfLastCoach = currentPage * itemsPerPage
  const indexOfFirstCoach = indexOfLastCoach - itemsPerPage
  const currentCoaches = coaches.slice(indexOfFirstCoach, indexOfLastCoach)

  useEffect(() => {
    fetchPrograms()
  }, [])

  useEffect(() => {
    fetchCoaches()
  }, [searchQuery, sortField, sortDirection])

  return (
    <div>
      <Sidebar />
      <div className="ml-60 bg-base-200 min-h-screen">
        <Navbar />
        <div className="p-8">
          <h1 className="font-bold text-xl mb-4">List of Coaches</h1>

          {error && (
            <div className="alert alert-error mb-4 flex justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="btn btn-sm btn-circle">
                ✕
              </button>
            </div>
          )}

          <div className="card bg-white w-full shadow-xl">
            <div className="card-body">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="w-full md:w-auto">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search coaches by name, ID or email..."
                      className="input input-bordered w-full md:w-80"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setSearchQuery("")}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button className="btn btn-sm btn-outline" onClick={handleAddCoach}>
                    Add Coach
                  </button>
                  <button className="btn btn-sm btn-outline" onClick={() => setIsUploadModalOpen(true)}>
                    Upload Coaches
                  </button>
                  <button
                    className="btn btn-sm bg-gray-900 text-white hover:bg-gray-800"
                    onClick={handleDownloadCsv}
                    disabled={coaches.length === 0}
                  >
                    Download as CSV
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : coaches.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No coaches found. Add a new coach or adjust your search.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                      <thead>
                        <tr>
                          <th className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort("lastName")}>
                            Coach Name
                            {sortField === "lastName" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </th>
                          <th className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort("coachId")}>
                            Coach ID
                            {sortField === "coachId" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </th>
                          <th className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort("email")}>
                            Email
                            {sortField === "email" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </th>
                          <th>Program</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentCoaches.map((coach) => (
                          <tr key={coach.id} className="hover">
                            <td>
                              {coach.firstName} {coach.lastName}
                            </td>
                            <td>{coach.coachId}</td>
                            <td>{coach.email}</td>
                            <td>{programs.find((p) => p.id === coach.programId)?.code || "N/A"}</td>
                            <td className="text-right">
                              <button className="btn btn-sm btn-outline mr-2" onClick={() => handleViewDetails(coach)}>
                                View
                              </button>
                              <button
                                className="btn btn-sm bg-red-500 hover:bg-red-600 text-white"
                                onClick={() => handleDelete(coach.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex justify-between items-center mt-6">
                    <p className="text-sm">
                      Showing {indexOfFirstCoach + 1} to {Math.min(indexOfLastCoach, coaches.length)} of{" "}
                      {coaches.length} coaches
                    </p>
                    <div className="flex space-x-2">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        &lt;
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i + 1}
                          className={`btn btn-sm ${currentPage === i + 1 ? "btn-active" : "btn-outline"}`}
                          onClick={() => handlePageChange(i + 1)}
                        >
                          {i + 1}
                        </button>
                      )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        &gt;
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View/Edit Coach Modal */}
      {isViewModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <h3 className="font-bold text-lg mb-4">Coach Information</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text">First Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("firstName", {
                    required: "First name is required",
                  })}
                />
                {errors.firstName && (
                  <span className="text-red-500 text-sm mt-1 block">{errors.firstName.message}</span>
                )}
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Last Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("lastName", {
                    required: "Last name is required",
                  })}
                />
                {errors.lastName && <span className="text-red-500 text-sm mt-1 block">{errors.lastName.message}</span>}
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Coach ID</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("coachId", { required: "Coach ID is required" })}
                />
                {errors.coachId && <span className="text-red-500 text-sm mt-1 block">{errors.coachId.message}</span>}
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Username</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("username", {
                    required: "Username is required",
                  })}
                />
                {errors.username && <span className="text-red-500 text-sm mt-1 block">{errors.username.message}</span>}
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Program</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  {...register("programId", { required: "Program is required" })}
                >
                  <option value="">Select Program</option>
                  {programs.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.code} - {prog.name}
                    </option>
                  ))}
                </select>
                {errors.programId && (
                  <span className="text-red-500 text-sm mt-1 block">{errors.programId.message}</span>
                )}
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Email Address</span>
                </label>
                <input
                  type="email"
                  className="input input-bordered w-full"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                />
                {errors.email && <span className="text-red-500 text-sm mt-1 block">{errors.email.message}</span>}
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Address</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("address", { required: "Address is required" })}
                />
                {errors.address && <span className="text-red-500 text-sm mt-1 block">{errors.address.message}</span>}
              </div>

              <div className="modal-action col-span-1 md:col-span-2 flex justify-between">
                <button type="submit" className="btn bg-gray-900 hover:bg-gray-800 text-white" disabled={isSubmitting}>
                  {isSubmitting ? <span className="loading loading-spinner loading-sm"></span> : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setIsViewModalOpen(false)
                    reset()
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Coach Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <h3 className="font-bold text-lg mb-4">Add New Coach</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text">First Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("firstName", {
                    required: "First name is required",
                  })}
                />
                {errors.firstName && (
                  <span className="text-red-500 text-sm mt-1 block">{errors.firstName.message}</span>
                )}
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Last Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("lastName", {
                    required: "Last name is required",
                  })}
                />
                {errors.lastName && <span className="text-red-500 text-sm mt-1 block">{errors.lastName.message}</span>}
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Coach ID</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("coachId", { required: "Coach ID is required" })}
                />
                {errors.coachId && <span className="text-red-500 text-sm mt-1 block">{errors.coachId.message}</span>}
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Username</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("username", {
                    required: "Username is required",
                  })}
                />
                {errors.username && <span className="text-red-500 text-sm mt-1 block">{errors.username.message}</span>}
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Program</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  {...register("programId", { required: "Program is required" })}
                >
                  <option value="">Select Program</option>
                  {programs.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.code} - {prog.name}
                    </option>
                  ))}
                </select>
                {errors.programId && (
                  <span className="text-red-500 text-sm mt-1 block">{errors.programId.message}</span>
                )}
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Email Address</span>
                </label>
                <input
                  type="email"
                  className="input input-bordered w-full"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                />
                {errors.email && <span className="text-red-500 text-sm mt-1 block">{errors.email.message}</span>}
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Address</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("address", { required: "Address is required" })}
                />
                {errors.address && <span className="text-red-500 text-sm mt-1 block">{errors.address.message}</span>}
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered w-full bg-gray-100"
                  value="password"
                  disabled
                  {...register("password")}
                />
                <span className="text-gray-500 text-xs mt-1 block">Default password will be set</span>
              </div>

              <div className="modal-action col-span-1 md:col-span-2 flex justify-between">
                <button type="submit" className="btn bg-gray-900 hover:bg-gray-800 text-white" disabled={isSubmitting}>
                  {isSubmitting ? <span className="loading loading-spinner loading-sm"></span> : "Save Coach"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setIsModalOpen(false)
                    reset()
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload CSV Modal */}
      {isUploadModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Upload Coaches</h3>
            <div>
              <label className="label">
                <span className="label-text">CSV File</span>
              </label>
              <input
                type="file"
                accept=".csv"
                className="file-input file-input-bordered w-full"
                onChange={(e) => setCsvFile(e.target.files[0])}
              />
              <div className="mt-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox mr-2"
                    checked={csvFormat}
                    onChange={() => setCsvFormat(!csvFormat)}
                  />
                  <span className="label-text">Show CSV format</span>
                </label>

                {csvFormat && (
                  <div className="mt-2 p-3 bg-gray-100 rounded-md text-sm">
                    <p className="font-semibold mb-1">Required CSV format:</p>
                    <code>firstName,lastName,coachId,username,email,address,programId</code>
                    <p className="mt-2 text-gray-600">Example:</p>
                    <code>John,Doe,COACH001,johndoe,john@example.com,123 Main St,1</code>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-action">
              <button
                className="btn bg-gray-900 hover:bg-gray-800 text-white"
                onClick={handleUpload}
                disabled={!csvFile}
              >
                Upload
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setIsUploadModalOpen(false)
                  setCsvFile(null)
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
