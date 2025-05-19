// File: Coaches.jsx

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Navbar } from "../../components/ui/Navbar";
import { Sidebar } from "../../components/ui/Sidebar";
import { PORT } from "../../utils/constants";

export function Coaches() {
  const [coaches, setCoaches] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  const fetchCoaches = async () => {
    try {
      const response = await axios.get(`${PORT}/coaches`, {
        params: { q: searchQuery },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setCoaches(response.data);
    } catch (error) {
      console.error("Error fetching coaches:", error);
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

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        programId: parseInt(data.programId),
        password: "password",
      };
      if (selectedCoach) {
        await axios.patch(`${PORT}/coaches/${selectedCoach.id}`, payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
      } else {
        await axios.post(`${PORT}/coaches`, payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
      }
      setIsModalOpen(false);
      setIsViewModalOpen(false);
      reset();
      fetchCoaches();
    } catch (error) {
      console.error("Error saving coach:", error);
    }
  };

  const handleDelete = async (coachId) => {
    try {
      const confirmed = window.confirm(
        "Are you sure you want to delete this coach?"
      );
      if (!confirmed) return;

      await axios.delete(`${PORT}/coaches/${coachId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      fetchCoaches(); // Refresh the coaches' list after deletion
      alert("Coach deleted successfully!");
    } catch (error) {
      console.error("Error deleting coach:", error);
      alert("Failed to delete the coach. Please try again.");
    }
  };

  const handleViewDetails = async (coach) => {
    try {
      const response = await axios.get(`${PORT}/coaches/${coach.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      const coachData = response.data;

      // Set the selected coach and open the modal
      setSelectedCoach(coachData);
      setIsViewModalOpen(true);

      // Populate form fields with coach data
      for (const [key, value] of Object.entries(coachData)) {
        setValue(key, value); // Use React Hook Form's setValue
      }
    } catch (error) {
      console.error("Error fetching coach details:", error);
    }
  };

  const handleUpload = async () => {
    if (!csvFile) return console.error("No file selected");

    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      await axios.post(`${PORT}/coaches/upload`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setIsUploadModalOpen(false);
      setCsvFile(null);
      fetchCoaches();
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  // CSV download handler for coaches
  const handleDownloadCsv = () => {
    // Build CSV header
    let csv = "Coach Name,Coach ID,Email\n";

    // Append each coach as a CSV row
    coaches.forEach((coach) => {
      const coachName = `${coach.firstName} ${coach.lastName}`;
      const coachId = coach.coachId;
      const email = coach.email;

      csv += `"${coachName}","${coachId}","${email}"\n`;
    });

    // Create a Blob from the CSV string and create a temporary download link
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "coaches.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    fetchCoaches();
  }, [searchQuery]);

  return (
    <div>
      <Sidebar />
      <div className="ml-60 bg-base-200">
        <Navbar />
        <div className="p-8">
          <h1 className="font-bold text-xl mb-8 pl-4">List of Coaches</h1>
          <div className="card bg-white w-full shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-center mb-2">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="Search coaches here..."
                    className="input input-bordered w-72"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center mb-6">
                <div className="flex space-x-4">
                  <button
                    className="btn btn-xs btn-outline"
                    onClick={() => setIsModalOpen(true)}
                  >
                    Add Coach
                  </button>
                  <button
                    className="btn btn-xs btn-outline"
                    onClick={() => setIsUploadModalOpen(true)}
                  >
                    Upload Coaches
                  </button>
                </div>
                <div>
                  <button
                    className="btn btn-xs bg-gray-900 text-white hover:bg-gray-800"
                    onClick={handleDownloadCsv}
                  >
                    Download as csv
                  </button>
                </div>
              </div>

              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Coach Name</th>
                    <th>Coach ID</th>
                    <th>Email</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {coaches.map((coach) => (
                    <tr key={coach.id}>
                      <td>
                        {coach.firstName} {coach.lastName}
                      </td>
                      <td>{coach.coachId}</td>
                      <td>{coach.email}</td>
                      <td className="space-x-2">
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleViewDetails(coach)}
                        >
                          View details
                        </button>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleDelete(coach.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm">1 of 1</p>
                <div className="flex space-x-2">
                  <button className="btn btn-outline">&lt;</button>
                  <button className="btn btn-outline">&gt;</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isViewModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Coach Information</h3>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-4 grid grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm">First Name</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("firstName", {
                    required: "First name is required",
                  })}
                />
                {errors.firstName && (
                  <span className="text-red-500 text-sm">
                    {errors.firstName.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Last Name</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("lastName", {
                    required: "Last name is required",
                  })}
                />
                {errors.lastName && (
                  <span className="text-red-500 text-sm">
                    {errors.lastName.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Coach ID</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("coachId", { required: "Coach ID is required" })}
                />
                {errors.coachId && (
                  <span className="text-red-500 text-sm">
                    {errors.coachId.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Username</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("username", {
                    required: "Username is required",
                  })}
                />
                {errors.username && (
                  <span className="text-red-500 text-sm">
                    {errors.username.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Course</label>
                <select
                  className="select select-bordered w-full"
                  {...register("programId", { required: "Course is required" })}
                >
                  <option value="">Select Course</option>
                  {programs.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.code}
                    </option>
                  ))}
                </select>
                {errors.programId && (
                  <span className="text-red-500 text-sm">
                    {errors.programId.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Email Address</label>
                <input
                  type="email"
                  className="input input-bordered w-full"
                  {...register("email", { required: "Email is required" })}
                />
                {errors.email && (
                  <span className="text-red-500 text-sm">
                    {errors.email.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Address</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("address", { required: "Address is required" })}
                />
                {errors.address && (
                  <span className="text-red-500 text-sm">
                    {errors.address.message}
                  </span>
                )}
              </div>

              <div className="modal-action col-span-2 flex justify-between">
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsViewModalOpen(false)}
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
            <h3 className="font-bold text-lg">Add Coach</h3>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-4 grid grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm">First Name</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("firstName", {
                    required: "First name is required",
                  })}
                />
                {errors.firstName && (
                  <span className="text-red-500 text-sm">
                    {errors.firstName.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Last Name</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("lastName", {
                    required: "Last name is required",
                  })}
                />
                {errors.lastName && (
                  <span className="text-red-500 text-sm">
                    {errors.lastName.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Coach ID</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("coachId", { required: "Coach ID is required" })}
                />
                {errors.coachId && (
                  <span className="text-red-500 text-sm">
                    {errors.coachId.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Username</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("username", {
                    required: "Username is required",
                  })}
                />
                {errors.username && (
                  <span className="text-red-500 text-sm">
                    {errors.username.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Course</label>
                <select
                  className="select select-bordered w-full"
                  {...register("programId", { required: "Course is required" })}
                >
                  <option value="">Select Course</option>
                  {programs.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.code}
                    </option>
                  ))}
                </select>
                {errors.programId && (
                  <span className="text-red-500 text-sm">
                    {errors.programId.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Email Address</label>
                <input
                  type="email"
                  className="input input-bordered w-full"
                  {...register("email", { required: "Email is required" })}
                />
                {errors.email && (
                  <span className="text-red-500 text-sm">
                    {errors.email.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Address</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("address", { required: "Address is required" })}
                />
                {errors.address && (
                  <span className="text-red-500 text-sm">
                    {errors.address.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Password</label>
                <input
                  type="password"
                  className="input input-bordered w-full"
                  value="password"
                  disabled
                  {...register("password")}
                />
              </div>
              <div className="modal-action col-span-2 flex justify-between">
                <button
                  type="submit"
                  className="btn bg-red-500 hover:bg-red-600 text-white"
                >
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isUploadModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Upload Coaches</h3>
            <div className="mt-4">
              <label className="block text-sm">CSV File</label>
              <input
                type="file"
                accept=".csv"
                className="file-input file-input-bordered w-full"
                onChange={(e) => setCsvFile(e.target.files[0])}
              />
            </div>
            <div className="modal-action">
              <button
                className="btn bg-red-500 hover:bg-red-600 text-white"
                onClick={handleUpload}
              >
                Upload
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsUploadModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
