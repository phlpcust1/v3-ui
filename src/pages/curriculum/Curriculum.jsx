"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import axios from "axios"
import { Navbar } from "../../components/ui/Navbar"
import { Sidebar } from "../../components/ui/Sidebar"
import { PORT } from "../../utils/constants"

export function Curriculum() {
  const userRole = localStorage.getItem("role")

  const [curriculums, setCurriculums] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [programs, setPrograms] = useState([])
  const [courses, setCourses] = useState([])
  const [curriculumFilter, setCurriculumFilter] = useState("All")
  const [yearFilter, setYearFilter] = useState("All")
  const [semFilter, setSemFilter] = useState("All")
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [activeTab, setActiveTab] = useState(userRole === "COACH" ? "Courses" : "List of Curriculum")

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  const fetchCurriculums = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${PORT}/curriculums`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      setCurriculums(response.data)
      setError(null)
    } catch (error) {
      console.error("Error fetching curriculums:", error)
      setError("Failed to load curriculums. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${PORT}/courses`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      setCourses(response.data)
      setError(null)
    } catch (error) {
      console.error("Error fetching courses:", error)
      setError("Failed to load courses. Please try again.")
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
      setError(null)
    } catch (error) {
      console.error("Error fetching programs:", error)
      setError("Failed to load programs. Please try again.")
    }
  }

  const filteredCourses = courses.filter((course) => {
    const matchesCurriculum = curriculumFilter === "All" || course.curriculumId.toString() === curriculumFilter
    const matchesYear = yearFilter === "All" || course.year === yearFilter
    const matchesSem = semFilter === "All" || course.sem.toString() === semFilter

    return matchesCurriculum && matchesYear && matchesSem
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  const {
    register: registerCourse,
    handleSubmit: handleSubmitCourse,
    reset: resetCourse,
    formState: { errors: courseErrors },
  } = useForm()

  useEffect(() => {
    fetchCurriculums()
    fetchCourses()
    fetchPrograms()
  }, [])

  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false)
  const [isUploadFileModalOpen, setIsUploadFileModalOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)

  const onSubmitAddCourse = async (data) => {
    try {
      setIsSubmitting(true)
      await axios.post(
        `${PORT}/courses`,
        {
          ...data,
          curriculumId: selectedCurriculumId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        },
      )
      setIsAddCourseModalOpen(false)
      resetCourse()
      fetchCourses()
      setError(null)
    } catch (error) {
      console.error("Error adding course:", error)
      setError("Failed to add course. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUploadCourses = async (e) => {
    e.preventDefault()
    if (!uploadFile) {
      setError("No file selected")
      return
    }

    if (!selectedCurriculumId || selectedCurriculumId === "All") {
      setError("Please select a curriculum")
      return
    }

    const formData = new FormData()
    formData.append("file", uploadFile)
    formData.append("curriculumId", selectedCurriculumId)

    try {
      setIsSubmitting(true)
      await axios.post(`${PORT}/courses/upload`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "multipart/form-data",
        },
      })
      setIsUploadFileModalOpen(false)
      setUploadFile(null)
      fetchCourses()
      setError(null)
    } catch (error) {
      console.error("Error uploading file:", error)
      setError("Failed to upload courses. Please check your file format and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true)
      const payload = {
        ...data,
        rev: Number.parseInt(data.rev, 10), // Parse rev into an integer
      }

      await axios.post(`${PORT}/curriculums`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      setIsModalOpen(false)
      reset()
      fetchCurriculums() // Refresh the curriculum list
      setError(null)
    } catch (error) {
      console.error("Error adding curriculum:", error)
      setError("Failed to add curriculum. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const [selectedCurriculumId, setSelectedCurriculumId] = useState("")

  const handleDeleteCurriculum = async (id) => {
    if (!confirm("Are you sure you want to delete this curriculum?")) return

    try {
      setIsSubmitting(true)
      await axios.delete(`${PORT}/curriculums/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      fetchCurriculums() // Refresh list after delete
      setError(null)
    } catch (error) {
      console.error("Error deleting curriculum:", error)
      setError("Failed to delete curriculum. It may be in use by courses.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // CSV download handler for courses
  const handleDownloadCoursesCsv = () => {
    if (filteredCourses.length === 0) {
      setError("No courses to download")
      return
    }

    // Build CSV header for courses
    let csv = "Subject,Description,Units,Sem,Year\n"

    // Append each filtered course as a CSV row
    filteredCourses.forEach((course) => {
      // Wrap each field in quotes to prevent CSV issues
      csv += `"${course.subject}","${course.description}","${course.units}","${course.sem}","${course.year}"\n`
    })

    // Create a Blob from the CSV string and trigger download
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "courses.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading && curriculums.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4">Loading curriculum data...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Sidebar />
      <div className="ml-60 bg-base-200 min-h-screen">
        <Navbar />
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="font-bold text-2xl pl-4">Curriculum Management</h1>
            {error && (
              <div className="alert alert-error shadow-lg max-w-md">
                <div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current flex-shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
                <div className="flex-none">
                  <button onClick={() => setError(null)} className="btn btn-sm btn-ghost">
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="card bg-white w-full shadow-xl">
            <div className="card-body">
              <div className="tabs tabs-boxed bg-base-200 mb-6 inline-flex">
                {userRole !== "COACH" && (
                  <a
                    className={`tab ${activeTab === "List of Curriculum" ? "bg-gray-200 text-black" : ""}`}
                    onClick={() => handleTabChange("List of Curriculum")}
                  >
                    List of Curriculum
                  </a>
                )}
                <a
                  className={`tab ${activeTab === "Courses" ? "bg-gray-200 text-black" : ""}`}
                  onClick={() => handleTabChange("Courses")}
                >
                  Courses
                </a>
              </div>

              {activeTab === "List of Curriculum" && (
                <div>
                  <div className="overflow-x-auto">
                    {curriculums.length > 0 ? (
                      <table className="table table-zebra w-full">
                        <thead className="bg-base-200">
                          <tr>
                            <th>CURR ID#</th>
                            <th>REV#</th>
                            <th>EFFECTIVITY</th>
                            <th>CMO NAME</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {curriculums.map((curriculum) => (
                            <tr key={curriculum.id} className="hover">
                              <td className="font-medium">{curriculum.code}</td>
                              <td>{curriculum.rev}</td>
                              <td>{curriculum.effectivity}</td>
                              <td>{curriculum.cmoName}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-error text-white"
                                  onClick={() => handleDeleteCurriculum(curriculum.id)}
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                  ) : (
                                    "Delete"
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-10">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12 mx-auto text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="mt-4 text-lg font-medium">No curriculums found</p>
                        <p className="text-gray-500">Add a new curriculum to get started</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <button className="btn btn-neutral" onClick={() => setIsModalOpen(true)}>
                      Add Curriculum
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "Courses" && (
                <div>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div className="flex flex-wrap gap-2">
                      <button className="btn btn-neutral" onClick={() => setIsAddCourseModalOpen(true)}>
                        Add Course
                      </button>
                      <button className="btn btn-outline" onClick={() => setIsUploadFileModalOpen(true)}>
                        Upload Courses
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={handleDownloadCoursesCsv}
                        disabled={filteredCourses.length === 0}
                      >
                        Download as CSV
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="form-control">
                        <select
                          className="select select-bordered"
                          value={selectedCurriculumId}
                          onChange={(e) => {
                            setCurriculumFilter(e.target.value)
                            setSelectedCurriculumId(e.target.value)
                          }}
                        >
                          <option value="All">All Curriculum</option>
                          {curriculums.map((curr) => (
                            <option key={curr.id} value={curr.id}>
                              {curr.code}
                            </option>
                          ))}
                        </select>
                      </div>

                      <select
                        className="select select-bordered"
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                      >
                        <option value="All">All Years</option>
                        <option value="FIRST">First Year</option>
                        <option value="SECOND">Second Year</option>
                        <option value="THIRD">Third Year</option>
                        <option value="FOURTH">Fourth Year</option>
                      </select>
                      <select
                        className="select select-bordered"
                        value={semFilter}
                        onChange={(e) => setSemFilter(e.target.value)}
                      >
                        <option value="All">All Semesters</option>
                        <option value="1">1st Semester</option>
                        <option value="2">2nd Semester</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    {filteredCourses.length > 0 ? (
                      <table className="table table-zebra w-full">
                        <thead className="bg-base-200">
                          <tr>
                            <th>Subject</th>
                            <th>Description</th>
                            <th>Units</th>
                            <th>Sem</th>
                            <th>Year</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCourses.map((course) => (
                            <tr key={course.id} className="hover">
                              <td className="font-medium">{course.subject}</td>
                              <td>{course.description}</td>
                              <td>{course.units}</td>
                              <td>
                                <span className="badge">{course.sem}</span>
                              </td>
                              <td>
                                <span className="badge badge-outline">{course.year}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-10">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12 mx-auto text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        <p className="mt-4 text-lg font-medium">No courses found</p>
                        <p className="text-gray-500">
                          {curriculumFilter === "All"
                            ? "Add a new course or adjust your filters"
                            : "Add a new course to this curriculum"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isAddCourseModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Add Course</h3>
            <form onSubmit={handleSubmitCourse(onSubmitAddCourse)} className="mt-4 grid gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Curriculum</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={selectedCurriculumId}
                  onChange={(e) => setSelectedCurriculumId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select a curriculum
                  </option>
                  {curriculums.map((curr) => (
                    <option key={curr.id} value={curr.id}>
                      {curr.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Subject</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  {...registerCourse("subject", { required: "Subject is required" })}
                />
                {courseErrors.subject && <span className="text-red-500 text-sm">{courseErrors.subject.message}</span>}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  {...registerCourse("description", {
                    required: "Description is required",
                  })}
                />
                {courseErrors.description && (
                  <span className="text-red-500 text-sm">{courseErrors.description.message}</span>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Units</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  {...registerCourse("units", { required: "Units are required" })}
                />
                {courseErrors.units && <span className="text-red-500 text-sm">{courseErrors.units.message}</span>}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Semester</span>
                </label>
                <select
                  className="select select-bordered"
                  {...registerCourse("sem", { required: "Semester is required" })}
                >
                  <option value="" disabled>
                    Select semester
                  </option>
                  <option value="1">1st Semester</option>
                  <option value="2">2nd Semester</option>
                </select>
                {courseErrors.sem && <span className="text-red-500 text-sm">{courseErrors.sem.message}</span>}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Year</span>
                </label>
                <select
                  className="select select-bordered"
                  {...registerCourse("year", { required: "Year is required" })}
                >
                  <option value="" disabled>
                    Select year
                  </option>
                  <option value="FIRST">First Year</option>
                  <option value="SECOND">Second Year</option>
                  <option value="THIRD">Third Year</option>
                  <option value="FOURTH">Fourth Year</option>
                </select>
                {courseErrors.year && <span className="text-red-500 text-sm">{courseErrors.year.message}</span>}
              </div>

              <div className="modal-action">
                <button type="submit" className="btn btn-neutral" disabled={isSubmitting || !selectedCurriculumId}>
                  {isSubmitting ? <span className="loading loading-spinner loading-xs"></span> : "Submit"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setIsAddCourseModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isUploadFileModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Upload Courses</h3>
            <form onSubmit={handleUploadCourses} className="mt-4">
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Select Curriculum</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={selectedCurriculumId}
                  onChange={(e) => setSelectedCurriculumId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select a curriculum
                  </option>
                  {curriculums.map((curr) => (
                    <option key={curr.id} value={curr.id}>
                      {curr.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Upload CSV File</span>
                </label>
                <input
                  type="file"
                  accept=".csv"
                  className="file-input file-input-bordered w-full"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-gray-500">CSV format: Subject,Description,Units,Sem,Year</span>
                </label>
              </div>

              <div className="modal-action">
                <button
                  type="submit"
                  className="btn btn-neutral"
                  disabled={isSubmitting || !uploadFile || !selectedCurriculumId || selectedCurriculumId === "All"}
                >
                  {isSubmitting ? <span className="loading loading-spinner loading-xs"></span> : "Upload"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setIsUploadFileModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Add Curriculum</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">CURR ID#</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  {...register("code", { required: "CURR ID# is required" })}
                />
                {errors.code && <span className="text-red-500 text-sm">{errors.code.message}</span>}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">REV#</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  {...register("rev", {
                    required: "REV# is required",
                    validate: (value) => !isNaN(value) || "REV# must be a number",
                  })}
                />
                {errors.rev && <span className="text-red-500 text-sm">{errors.rev.message}</span>}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">EFFECTIVITY</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  {...register("effectivity", {
                    required: "Effectivity is required",
                  })}
                />
                {errors.effectivity && <span className="text-red-500 text-sm">{errors.effectivity.message}</span>}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">CMO NAME</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  {...register("cmoName", { required: "CMO Name is required" })}
                />
                {errors.cmoName && <span className="text-red-500 text-sm">{errors.cmoName.message}</span>}
              </div>

              <div className="modal-action">
                <button type="submit" className="btn btn-neutral" disabled={isSubmitting}>
                  {isSubmitting ? <span className="loading loading-spinner loading-xs"></span> : "Submit"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
