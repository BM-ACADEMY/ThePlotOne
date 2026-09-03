import { Modal, Form, Input, Rate, Button, message, Popconfirm, Pagination } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import React, { useEffect, useState, memo } from "react";
import {
  Star,
  Edit2,
  Trash2,
  Plus,
  Home as HomeIcon,
  Quote,
  Calendar,
  Award,
  User,
} from "lucide-react";

const { TextArea } = Input;
import axios from "axios";
import Loader from "@/components/Common/Loader";
const noReviewsImg = "/assets/Customer Survey-pana-optimized.webp";

const ReviewCard = memo(
  ({ testimonial, getStatusBadgeStyles, handleEdit, handleDelete }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-6 relative hover:shadow-md transition-shadow"
    >
      {/* Header section */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-[52px] h-[52px] rounded-full bg-[#E2EAF4] flex items-center justify-center shrink-0 overflow-hidden">
          <User
            className="w-[42px] h-[42px] text-[#547CB4]"
            fill="currentColor"
          />
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <h3 className="text-[20px] font-bold text-slate-800 leading-tight">
            {testimonial.name}
          </h3>
          {/* Role hidden as per request */}
          {/* {testimonial.role && (
            <p className="text-[14px] text-slate-500 font-medium mt-0.5">
              {testimonial.role}
            </p>
          )} */}

          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex gap-[1px]">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-[15px] h-[15px] ${
                    i < testimonial.rating
                      ? "fill-[#FBBB3B] text-[#FBBB3B]"
                      : "fill-slate-200 text-slate-200"
                  }`}
                />
              ))}
            </div>
            {testimonial.status !== "pending" && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase ${getStatusBadgeStyles(testimonial.status)}`}
              >
                {testimonial.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-[#f8f9fc] rounded-[14px] p-5 relative min-h-[85px] flex items-start">
        <span className="absolute top-2 left-4 text-[54px] text-[#e2e8ea] font-serif leading-none tracking-tighter mix-blend-multiply"></span>
        <p className="text-slate-600 text-[15px] leading-[1.6] pl-10 relative   pt-2">
          {testimonial.content}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 -mt-1 border-t border-slate-100/80 dashed opacity-90 border-dashed">
        <div className="flex items-center text-[13.5px] text-slate-400 font-medium">
          <Calendar
            className="w-[17px] h-[17px] mr-2.5 text-slate-400/80"
            strokeWidth={2}
          />
          {new Date(testimonial.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>

        <div className="flex items-center gap-4 pr-1">
          {/* <button
          onClick={() => handleEdit(testimonial)}
          className="text-slate-300 hover:text-[#4678E6] transition-colors"
          title="Edit Review"
        >
          <Edit2 className="w-[19px] h-[19px]" strokeWidth={2} />
        </button> */}

          <Popconfirm
            title="Delete Review"
            description="Are you sure you want to remove this review?"
            onConfirm={() => handleDelete(testimonial._id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true, size: "small" }}
            cancelButtonProps={{ size: "small" }}
          >
            <button
              className="text-slate-300 hover:text-rose-500 transition-colors"
              title="Delete Review"
            >
              <Trash2 className="w-[19px] h-[19px]" strokeWidth={2} />
            </button>
          </Popconfirm>
        </div>
      </div>
    </motion.div>
  ),
);

const Reviews = () => {
  const { user, isAuthenticated } = useAuth();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 3;
  const [form] = Form.useForm();

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserTestimonials();
    }
  }, [isAuthenticated, user]);

  const fetchUserTestimonials = async () => {
    try {
      setLoading(true);
      const userId = user?.user?._id || user?._id;
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/testimonials/user/${userId}`,
      );
      console.log("User testimonials data:", res.data); // Debug log
      setTestimonials(res.data);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      message.error("Failed to load your reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateTestimonial = async (values) => {
    setSubmitLoading(true);
    try {
      const userId = user?.user?._id || user?._id;
      const userName = user?.user?.name || user?.name || "User";
      const testimonialData = {
        ...values,
        user_id: userId,
        name: userName,
      };

      if (editingTestimonial) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/testimonials/${editingTestimonial._id}`,
          testimonialData,
        );
        message.success("Review updated successfully!");
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/testimonials`,
          testimonialData,
        );
        message.success("Review submitted for approval!");
      }

      setIsModalOpen(false);
      setEditingTestimonial(null);
      form.resetFields();
      fetchUserTestimonials();
    } catch (error) {
      message.error(
        editingTestimonial
          ? "Failed to update review"
          : "Failed to submit review",
      );
      console.error("Error:", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = (testimonial) => {
    setEditingTestimonial(testimonial);
    form.setFieldsValue({
      rating: testimonial.rating,
      content: testimonial.content,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (testimonialId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/testimonials/${testimonialId}`,
      );
      message.success("Review deleted successfully");
      fetchUserTestimonials();
    } catch (error) {
      message.error("Failed to delete review");
      console.error("Error:", error);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTestimonial(null);
    form.resetFields();
  };

  const handleWriteNewReview = () => {
    form.resetFields();
    form.setFieldsValue({
      // role hidden
    });
    setEditingTestimonial(null);
    setIsModalOpen(true);
  };

  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case "approved":
        return "bg-[#E6F4EA] text-[#1E8E3E]";
      case "pending":
        return "bg-[#FCE6BD] text-[#B87A26]";
      case "rejected":
        return "bg-[#FCE8E6] text-[#D93025]";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  if (loading) {
    return <Loader variant="panel" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center border border-slate-100">
          <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <HomeIcon className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-800 mb-2">
            Welcome Back
          </h2>
          <p className="text-slate-500 mb-6">
            Please log in to manage your reviews.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex-1 bg-[#eff7f3] py-4 md:py-6 flex flex-col relative overflow-hidden">
      {/* Subtle background element */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-tr from-teal-50/50 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl w-full flex-1 flex flex-col relative  ">
        <div className="p-6 lg:p-8 relative">
          {/* Modern Header */}
          <div className="flex flex-row justify-between items-center mb-8 gap-4 relative   w-full">
            <div>
              <h1 className="text-[32px] font-bold text-slate-800">
                My Reviews
              </h1>
              <p className="text-slate-500 mt-2 text-[15px]">
                Share your experiences and help others make informed decisions.
              </p>
            </div>
            <button
              onClick={handleWriteNewReview}
              className="bg-[#166aa8] hover:bg-[#0078d7]! cursor-pointer text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all font-medium text-[15px] shadow-sm relative  "
            >
              <Plus className="w-5 h-5" />
              Write New Review
            </button>
          </div>

          <div className="relative  ">
            {/* Reviews Grid */}
            {testimonials.length === 0 ? (
              <div className="bg-white rounded-[24px] shadow-sm p-6 lg:p-10 flex flex-col items-center justify-center text-center">
                <img
                  src={noReviewsImg}
                  alt="No reviews illustration"
                  className="w-full max-w-[200px] md:max-w-[280px] mb-4 object-contain"
                />
                <h3 className="text-xl md:text-[22px] font-bold text-slate-800 mb-1.5">
                  No Reviews Yet
                </h3>
                <p className="text-slate-500 max-w-md text-sm md:text-[14px] leading-relaxed mx-auto">
                  You haven't shared any experiences. Your reviews help others
                  make better choices.
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {testimonials
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((testimonial) => (
                      <ReviewCard
                        key={testimonial._id}
                        testimonial={testimonial}
                        getStatusBadgeStyles={getStatusBadgeStyles}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                      />
                    ))}
                </div>

                {/* Pagination */}
                {testimonials.length > pageSize && (
                  <div className="mt-12 flex justify-center">
                    <Pagination
                      current={currentPage}
                      pageSize={pageSize}
                      total={testimonials.length}
                      onChange={(page) => setCurrentPage(page)}
                      showSizeChanger={false}
                      className="custom-pagination"
                    />
                  </div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Modal - Write/Edit Review */}
      <Modal
        title={
          <div className="text-xl font-serif font-bold text-slate-800">
            {editingTestimonial ? "Edit Your Review" : "Share Your Experience"}
          </div>
        }
        open={isModalOpen}
        onCancel={handleModalClose}
        footer={null}
        width={600}
        className="rounded-2xl"
        centered
        destroyOnClose
        modalRender={(modal) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
          >
            {modal}
          </motion.div>
        )}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateOrUpdateTestimonial}
          className="mt-6"
        >
          {/* Display User Name */}
          {/* <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200"> */}
          {/* <div className="flex items-center gap-3"> */}
          {/* <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {(user?.user?.name || user?.name || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div> */}
          {/* <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
                  Reviewing as
                </p>
                <p className="text-lg font-semibold text-slate-800">
                  {user?.user?.name || user?.name || "User"}
                </p>
              </div> */}
          {/* </div> */}
          {/* </div> */}

          {/* Role field hidden as per request */}
          {/* <Form.Item
            name="role"
            label={
              <span className="font-medium text-slate-700">Your Role</span>
            }
            rules={[{ required: true, message: "Please specify your role" }]}
          >
            <Input
              placeholder="e.g., Property Seller, Home Buyer, Agent"
              className="rounded-lg border-slate-300 focus:border-slate-500 hover:border-slate-400 py-2"
              disabled={
                !!(user?.user?.businessType?.name || user?.businessType?.name)
              }
            />
          </Form.Item> */}

          <Form.Item
            name="rating"
            label={
              <span className="font-medium text-slate-700">Overall Rating</span>
            }
            rules={[{ required: true, message: "Please provide a rating" }]}
          >
            <Rate className="text-amber-400 text-2xl" />
          </Form.Item>

          <Form.Item
            name="content"
            label={
              <span className="font-medium text-slate-700">Your Review</span>
            }
            rules={[{ required: true, message: "Please share your thoughts" }]}
          >
            <TextArea
              rows={5}
              placeholder="Share your experience with our service..."
              maxLength={250}
              showCount
              className="rounded-lg border-slate-300 focus:border-slate-500 hover:border-slate-400"
            />
          </Form.Item>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <Button
              size="large"
              onClick={handleModalClose}
              className="border-slate-300 text-slate-600 hover:text-slate-800 hover:border-slate-400"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitLoading}
              size="large"
              className="bg-[#166aa8] hover:bg-[#0078d7]! border-none shadow-md"
            >
              {editingTestimonial ? "Update Review" : "Submit Review"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Reviews;
