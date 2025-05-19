import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Navbar } from "../../components/ui/Navbar";
import { Sidebar } from "../../components/ui/Sidebar";
import { PORT } from "../../utils/constants";

export function Curriculum() {
  const userRole = localStorage.getItem("role");

  const [curriculums, setCurriculums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [curriculumFilter, setCurriculumFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [semFilter, setSemFilter] = useState("All");

  const [activeTab, setActiveTab] = useState(
    userRole === "COACH" ? "Courses" : "List of Curriculum"
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const fetchCurriculums = async () => {
    try {
      const response = await axios.get(`${PORT}/curriculums`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setCurriculums(response.data);
    } catch (error) {
      console.error("Error fetching curriculums:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${PORT}/courses`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await axios.get(`${PORT}/programs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setPrograms(response.data);
    } catch (error) {
      console.error("Error fetching programs:", error);
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesCurriculum =
      curriculumFilter === "All" ||
      course.curriculumId.toString() === curriculumFilter;
    const matchesYear = yearFilter === "All" || course.year === yearFilter;
    const matchesSem =
      semFilter === "All" || course.sem.toString() === semFilter;

    return matchesCurriculum && matchesYear && matchesSem;
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    fetchCurriculums();
    fetchCourses();
    fetchPrograms();
  }, []);

  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [isUploadFileModalOpen, setIsUploadFileModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);

  const onSubmitAddCourse = async (data) => {
    try {
      await axios.post(`${PORT}/courses`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setIsAddCourseModalOpen(false);
      fetchCourses();
    } catch (error) {
      console.error("Error adding course:", error);
    }
  };

  const handleUploadCourses = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      console.error("No file selected");
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("curriculumId", selectedCurriculumId);

    try {
      await axios.post(`${PORT}/courses/upload`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setIsUploadFileModalOpen(false);
      fetchCourses();
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        rev: parseInt(data.rev, 10), // Parse rev into an integer
      };

      await axios.post(`${PORT}/curriculums`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      setIsModalOpen(false);
      reset();
      fetchCurriculums(); // Refresh the curriculum list
    } catch (error) {
      console.error("Error adding curriculum:", error);
    }
  };

  const [selectedCurriculumId, setSelectedCurriculumId] = useState("");

  const handleDeleteCurriculum = async (id) => {
    if (!confirm("Are you sure you want to delete this curriculum?")) return;

    try {
      await axios.delete(`${PORT}/curriculums/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      fetchCurriculums(); // Refresh list after delete
    } catch (error) {
      console.error("Error deleting curriculum:", error);
    }
  };

  // CSV download handler for courses
  const handleDownloadCoursesCsv = () => {
    // Build CSV header for courses
    let csv = "Subject,Description,Units,Sem,Year\n";

    // Append each filtered course as a CSV row
    filteredCourses.forEach((course) => {
      // Wrap each field in quotes to prevent CSV issues
      csv += `"${course.subject}","${course.description}","${course.units}","${course.sem}","${course.year}"\n`;
    });

    // Create a Blob from the CSV string and trigger download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "courses.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Sidebar />
      <div className="ml-60 bg-base-200">
        <Navbar />
        <div className="p-8">
          <h1 className="font-bold text-xl mb-8 pl-4">Curriculum</h1>

          <div className="card bg-white w-full shadow-xl">
            <div className="card-body">
              <div className="tabs mb-4">
                {userRole !== "COACH" && (
                  <a
                    className={`tab tab-bordered ${
                      activeTab === "List of Curriculum" ? "tab-active" : ""
                    }`}
                    onClick={() => handleTabChange("List of Curriculum")}
                  >
                    List of Curriculum
                  </a>
                )}
                <a
                  className={`tab tab-bordered ${
                    activeTab === "Courses" ? "tab-active" : ""
                  }`}
                  onClick={() => handleTabChange("Courses")}
                >
                  Courses
                </a>
              </div>

              {activeTab === "List of Curriculum" && (
                <div>
                  <div className="overflow-x-auto">
                    <table className="table w-full">
                      <thead>
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
                          <tr key={curriculum.id}>
                            <td>{curriculum.code}</td>
                            <td>{curriculum.rev}</td>
                            <td>{curriculum.effectivity}</td>
                            <td>{curriculum.cmoName}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-error"
                                onClick={() =>
                                  handleDeleteCurriculum(curriculum.id)
                                }
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4">
                    <button
                      className="btn btn-outline"
                      onClick={() => setIsModalOpen(true)}
                    >
                      Add Curriculum
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "Courses" && (
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4 mb-4">
                      <button
                        className="btn btn-outline"
                        onClick={() => setIsAddCourseModalOpen(true)}
                      >
                        Add Course
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={() => setIsUploadFileModalOpen(true)}
                      >
                        Upload Courses
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={handleDownloadCoursesCsv}
                      >
                        Download as csv
                      </button>
                    </div>
                    <div className="flex gap-4 mb-4">
                      <div className="form-control">
                        <select
                          className="select select-bordered"
                          value={selectedCurriculumId}
                          onChange={(e) => {
                            setCurriculumFilter(e.target.value);
                            setSelectedCurriculumId(e.target.value);
                          }}
                          required
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
                    <table className="table w-full">
                      <thead>
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
                          <tr key={course.id}>
                            <td>{course.subject}</td>
                            <td>{course.description}</td>
                            <td>{course.units}</td>
                            <td>{course.sem}</td>
                            <td>{course.year}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
            <form
              onSubmit={handleSubmit(onSubmitAddCourse)}
              className="mt-4 grid gap-4"
            >
              <div className="form-control">
                <label className="label">Subject</label>
                <input
                  type="text"
                  className="input input-bordered"
                  {...register("subject", { required: "Subject is required" })}
                />
                {errors.subject && (
                  <span className="text-red-500 text-sm">
                    {errors.subject.message}
                  </span>
                )}
              </div>
              <div className="form-control">
                <label className="label">Description</label>
                <input
                  type="text"
                  className="input input-bordered"
                  {...register("description", {
                    required: "Description is required",
                  })}
                />
                {errors.description && (
                  <span className="text-red-500 text-sm">
                    {errors.description.message}
                  </span>
                )}
              </div>
              <div className="form-control">
                <label className="label">Units</label>
                <input
                  type="number"
                  className="input input-bordered"
                  {...register("units", { required: "Units are required" })}
                />
                {errors.units && (
                  <span className="text-red-500 text-sm">
                    {errors.units.message}
                  </span>
                )}
              </div>
              <div className="modal-action">
                <button type="submit" className="btn btn-success">
                  Submit
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsAddCourseModalOpen(false)}
                >
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
              <div className="form-control">
                <label className="label">Upload File</label>
                <input
                  type="file"
                  accept=".csv"
                  className="file-input file-input-bordered"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                />
              </div>
              <div className="modal-action">
                <button type="submit" className="btn btn-success">
                  Upload
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsUploadFileModalOpen(false)}
                >
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
                <label className="label">CURR ID#</label>
                <input
                  type="text"
                  className="input input-bordered"
                  {...register("code", { required: "CURR ID# is required" })}
                />
                {errors.code && (
                  <span className="text-red-500 text-sm">
                    {errors.code.message}
                  </span>
                )}
              </div>
              <div className="form-control">
                <label className="label">REV#</label>
                <input
                  type="number"
                  className="input input-bordered"
                  {...register("rev", {
                    required: "REV# is required",
                    validate: (value) =>
                      !isNaN(value) || "REV# must be a number",
                  })}
                />
                {errors.rev && (
                  <span className="text-red-500 text-sm">
                    {errors.rev.message}
                  </span>
                )}
              </div>
              <div className="form-control">
                <label className="label">EFFECTIVITY</label>
                <input
                  type="text"
                  className="input input-bordered"
                  {...register("effectivity", {
                    required: "Effectivity is required",
                  })}
                />
                {errors.effectivity && (
                  <span className="text-red-500 text-sm">
                    {errors.effectivity.message}
                  </span>
                )}
              </div>
              <div className="form-control">
                <label className="label">CMO NAME</label>
                <input
                  type="text"
                  className="input input-bordered"
                  {...register("cmoName", { required: "CMO Name is required" })}
                />
                {errors.cmoName && (
                  <span className="text-red-500 text-sm">
                    {errors.cmoName.message}
                  </span>
                )}
              </div>

              <div className="modal-action">
                <button type="submit" className="btn btn-success">
                  Submit
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
