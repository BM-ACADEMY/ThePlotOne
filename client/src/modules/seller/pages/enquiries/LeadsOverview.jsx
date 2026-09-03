import React, { useState, useEffect } from "react";
import { 
  Card, 
  Button, 
  Typography, 
  Tag, 
  Space, 
  message, 
  Empty, 
  Row, 
  Col, 
  Tooltip,
  Divider,
  Badge,
  Tabs,
  Select
} from "antd";
import { 
  ClipboardList, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle,
  LayoutDashboard,
  ShieldCheck,
  User,
  Lock,
  ArrowRight,
  MessageSquare
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import api, { getMySharedLeads, acceptSharedLead, rejectSharedLead, updateLeadStatus } from "@/services/api";
import { useSocket } from "@/context/SocketContext";
import Loader from "@/components/Common/Loader";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const CountdownTimer = ({ startTime, timerInMinutes, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const start = new Date(startTime);
      const diffMs = (start.getTime() + timerInMinutes * 60000) - now.getTime();

      if (diffMs <= 0) {
        setTimeLeft("00:00");
        if (onExpire) onExpire();
        return;
      }

      const minutes = Math.floor(diffMs / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [startTime, timerInMinutes, onExpire]);

  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-100/50 shadow-sm">
      <Clock size={12} className="animate-pulse" />
      <span className="font-mono font-bold text-[10px] tabular-nums">
        {timeLeft}
      </span>
    </div>
  );
};

// Helper to get status tag (moved outside for reuse)
const getStatusTag = (lead) => {
  if (lead.isAcceptedByMe) return <div className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm shadow-emerald-200">Accepted</div>;
  
  if (lead.status === "closed" || lead.status === "accepted" || lead.status === "Deal Closed (Plan Level)") {
    const isPlanLevel = lead.status === "Deal Closed (Plan Level)";
    return (
      <Tooltip title={isPlanLevel ? "Timer expired for your plan level" : `Accepted by ${lead.acceptedBy || "another seller"}`}>
        <div className="bg-slate-100 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-full border border-slate-200">
          {isPlanLevel ? "Closed (Plan)" : "Closed"}
        </div>
      </Tooltip>
    );
  }
  
  if (lead.matchType === "exact") {
    return (
      <div className="bg-amber-100 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1">
        <ShieldCheck size={12} />
        Exclusive
      </div>
    );
  }
  
  return <div className="bg-blue-50 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-full border border-blue-100">Open Lead</div>;
};

// Extracted LeadCard for better performance and debugging
const LeadCard = ({ lead, onAccept, onReject, onStatusChange, acceptingId, onExpire }) => (
  <Card 
    className="h-full rounded-[14px] shadow-[0_6px_18px_rgba(0,0,0,0.05)] border border-[#eee] overflow-hidden transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] bg-white flex flex-col"
    styles={{ body: { padding: 0, flex: 1, display: 'flex', flexDirection: 'column' } }}
  >
    {/* 1. Header (Soft Strip) */}
    <div className="bg-[#f7f9fb] px-4 py-3 border-b border-[#eee] flex justify-between items-center">
      <div className="flex flex-col gap-0.5">
        <Text className="text-[11px] font-semibold text-[#888] uppercase tracking-[0.5px]">
          Shared {new Date(lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </Text>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold text-[#222] tracking-tight">{lead.requirement.category}</span>
          <Divider type="vertical" className="m-0 bg-slate-300 h-3" />
          <span className="text-[11px] text-indigo-600 font-bold uppercase">{lead.requirement.usageType}</span>
        </div>
      </div>
      {getStatusTag(lead)}
    </div>

    <div className="p-4 flex flex-col flex-1">
      {/* 2. Property Info */}
      <div className="mb-[14px]">
        <Title level={4} className="m-0! text-[#222] font-semibold text-[18px] tracking-tight">
          {lead.requirement.propertyType}
        </Title>
        <div className="flex items-center gap-1.5 text-[#888] text-[13px] mt-1">
          <MapPin size={13} className="shrink-0" />
          <span className="truncate">{lead.requirement.preferredLocation || "Any Location"}</span>
        </div>
      </div>
      
      {/* 3. Preferences / Message Blocks */}
      <div className="space-y-[14px]">
        {lead.requirement.propertyPreferences && (
          <div className="bg-[#f8fafc] p-[10px_12px] rounded-[10px]">
            <Text className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#888] block mb-1">Preferences</Text>
            <Paragraph className="m-0 text-[#444] text-[13px] leading-relaxed italic" ellipsis={{ rows: 2, expandable: true, symbol: 'more' }}>
              &quot;{lead.requirement.propertyPreferences}&quot;
            </Paragraph>
          </div>
        )}

        {lead.requirement.message && (
          <div className="bg-[#f8fafc] p-[10px_12px] rounded-[10px]">
            <Text className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#888] block mb-1">Customer Message</Text>
            <Paragraph className="m-0 text-[#444] text-[13px] leading-relaxed" ellipsis={{ rows: 2, expandable: true, symbol: 'more' }}>
              {lead.requirement.message}
            </Paragraph>
          </div>
        )}
      </div>

      {/* 4. Budget & Type Row */}
      <div className="mt-[14px] p-3 bg-white border border-[#f1f5f9] rounded-xl flex flex-wrap items-center justify-between gap-y-3 shadow-sm">
        <div className="flex flex-col min-w-[100px]">
          <Text className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.5px] text-[#888] mb-1 leading-none">Max Budget</Text>
          <Text className="text-[#222] font-bold text-[14px] sm:text-[15px] leading-none">
            {lead.requirement.maxBudget ? `₹${lead.requirement.maxBudget.toLocaleString()}` : "Any"}
          </Text>
        </div>
        <Divider type="vertical" className="h-6 bg-[#eee] hidden sm:block" />
        <div className="flex flex-col items-start sm:items-end min-w-[100px]">
          <Text className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.5px] text-[#888] mb-1 leading-none">Type</Text>
          <div className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-[11px] sm:text-[12px] font-bold border border-indigo-100/50">
            {lead.requirement.category}
          </div>
        </div>
      </div>

      {/* 4.5 Timeframe & Closure Date */}
      {(lead.requirement.needTimeframe || lead.requirement.closureDate) && (
        <div className="mt-[14px] p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-3 shadow-sm">
          {lead.requirement.needTimeframe && (
            <div className="flex items-center justify-between">
              <Text className="text-[10px] font-bold uppercase tracking-[0.5px] text-slate-400">Requirement Timeframe</Text>
              <Text className="text-indigo-600 font-bold text-[13px]">{lead.requirement.needTimeframe}</Text>
            </div>
          )}
          {lead.requirement.closureDate && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
              <Text className="text-[10px] font-bold uppercase tracking-[0.5px] text-slate-400">Closure Date</Text>
              <Text className="text-emerald-600 font-bold text-[13px]">{dayjs(lead.requirement.closureDate).format("DD/MM/YYYY")}</Text>
            </div>
          )}
        </div>
      )}

      {/* 5. Contact Card */}
       {lead.showFullDetails ? (
        <div className="mt-[14px] bg-[#f6fffb] border border-[#d9f7e8] p-3.5 rounded-xl relative overflow-hidden group transition-all hover:border-emerald-300">
          {lead.matchType === 'exact' && (
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] font-black px-2.5 py-1 rounded-bl-xl uppercase tracking-widest shadow-sm">
              Matched
            </div>
          )}
          
          <div className="flex items-center gap-3 mb-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
               <ShieldCheck size={18} />
            </div>
            <div className="flex flex-col">
              <Title level={5} className="m-0! text-[#222] font-bold text-[14px]">Customer Contact</Title>
              <Text className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest leading-none">Verified Lead</Text>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-white/50 p-2 rounded-lg border border-emerald-50">
              <div className="p-1.5 bg-emerald-50 rounded-md">
                <User size={13} className="text-emerald-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-[#888] uppercase tracking-widest">Full Name</span>
                <span className="font-bold text-[#222] text-[13px]">{lead.requirement.fullName}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/50 p-2 rounded-lg border border-emerald-50">
              <div className="p-1.5 bg-emerald-50 rounded-md">
                <Phone size={13} className="text-emerald-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-[#888] uppercase tracking-widest">Phone Number</span>
                <span className="font-bold text-[#222] text-[13px]">{lead.requirement.phoneNumber}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-[14px] p-4 bg-slate-50 border border-slate-100 rounded-xl flex flex-col items-center justify-center text-center">
           <div className="w-10 h-10 rounded-full bg-slate-200/50 flex items-center justify-center mb-2">
              <Lock size={18} className="text-slate-400" />
           </div>
           <Text className="text-[#222] font-bold block text-sm">Contact Details Masked</Text>
           <Text className="text-[#888] text-[11px] max-w-[180px] mt-1">
             {lead.status === 'pending' 
               ? "Accept this lead to unlock the customer contact details." 
               : "Lead accepted by someone else."}
           </Text>
        </div>
      )}

      <div className="mt-auto pt-[14px]">
        {lead.status === 'pending' && !lead.showFullDetails && (
          <Button 
            type="primary" 
            block 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none rounded-xl h-[44px] font-bold text-sm shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all hover:shadow-[0_6px_20px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 group"
            disabled={acceptingId === lead._id}
            loading={acceptingId === lead._id}
            onClick={() => onAccept(lead._id)}
          >
            {!acceptingId && <CheckCircle2 size={16} className="text-blue-100 group-hover:scale-110 transition-transform" />}
            Accept Lead Now
          </Button>
        )}

        {lead.showFullDetails && !lead.isAcceptedByMe && lead.status === 'pending' && (
           <div className="flex gap-3">
             <Button 
               type="primary" 
               className="flex-1 bg-emerald-600 hover:bg-emerald-700 border-none rounded-xl h-[44px] font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
               disabled={acceptingId === lead._id}
               loading={acceptingId === lead._id}
               onClick={() => onAccept(lead._id)}
               icon={<CheckCircle2 size={16} />}
             >
               Accept
             </Button>
             <Button 
               className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 border-none rounded-xl h-[44px] font-bold text-sm transition-all flex items-center justify-center gap-2"
               disabled={acceptingId === lead._id}
               onClick={() => onReject(lead._id)}
               icon={<XCircle size={16} />}
             >
               Reject
             </Button>
           </div>
        )}

        {lead.isAcceptedByMe && (
           <div className="flex flex-col gap-3">
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lead Progress</span>
                 <Tag 
                   color={
                     lead.leadStatus === 'done' ? 'success' : 
                     lead.leadStatus === 'holded' ? 'error' : 
                     lead.leadStatus === 'in process' ? 'processing' : 'default'
                   }
                   className="m-0 text-[9px] font-black uppercase rounded-md border-none"
                 >
                   {lead.leadStatus || 'not yet connected'}
                 </Tag>
               </div>
               
               <Select
                 value={lead.leadStatus || 'not yet connected'}
                 onChange={(val) => onStatusChange(lead._id, val)}
                 className="w-full custom-status-select"
                 size="middle"
                 popupClassName="status-dropdown"
               >
                 <Option value="not yet connected">Not yet connected</Option>
                 <Option value="in process">In Process</Option>
                 <Option value="holded">Holded</Option>
                 <Option value="done">Done</Option>
               </Select>
             </div>

             <Button 
              block 
              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 rounded-xl h-[48px] font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
              onClick={() => window.location.href = `tel:${lead.requirement.phoneNumber}`}
              icon={<Phone size={20} className="animate-pulse" />}
            >
              Call Potential Client
            </Button>
          </div>
        )}

        {(lead.status === 'accepted' || lead.status === 'closed' || lead.status === 'Deal Closed (Plan Level)') && !lead.isAcceptedByMe && (
          <Button 
            block 
            className="bg-[#f5f5f5] border-none rounded-xl h-[44px] font-medium text-slate-400 cursor-not-allowed"
            disabled
          >
            {lead.status === 'Deal Closed (Plan Level)' ? 'Closed (Plan Level)' : 'Deal Closed'}
          </Button>
        )}
      </div>
    </div>
  </Card>
);

const LeadsOverview = () => {
  const socket = useSocket();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [hasActivePlan, setHasActivePlan] = useState(true);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const subRes = await api.get("/subscriptions/my-subscription");
      if (!subRes.data) {
        setHasActivePlan(false);
        setLeads([]);
        return;
      }
      setSubscription(subRes.data);
      setHasActivePlan(true);

      const response = await getMySharedLeads();
      setLeads(response.data.data);
    } catch (error) {
      console.error("Failed to fetch leads", error);
      message.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("new-lead-shared", (data) => {
        message.info("A new lead has been shared with your plan!");
        fetchLeads();
      });

      socket.on("lead-accepted-by-other", (data) => {
        setLeads(prevLeads => 
          prevLeads.map(lead => 
            (lead.requirement?._id === data.requirementId || lead._id === data.leadId)
              ? { ...lead, status: "closed", acceptedBy: data.acceptedBy } 
              : lead
          )
        );
      });

      socket.on("lead-expired-for-plan", (data) => {
        // Refresh leads to get the "Deal Closed (Plan Level)" status
        fetchLeads();
      });

      return () => {
        socket.off("new-lead-shared");
        socket.off("lead-accepted-by-other");
        socket.off("lead-expired-for-plan");
      };
    }
  }, [socket]);

  const handleAcceptLead = async (leadId) => {
    setAcceptingId(leadId);
    try {
      const response = await acceptSharedLead(leadId);
      message.success(response.data.message);
      fetchLeads();
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to accept lead";
      message.error(errorMsg);
      if (error.response?.status === 400) {
        fetchLeads();
      }
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRejectLead = async (leadId) => {
    setAcceptingId(leadId);
    try {
      const response = await rejectSharedLead(leadId);
      message.success(response.data.message);
      fetchLeads();
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to reject lead";
      message.error(errorMsg);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleStatusUpdate = async (leadId, newStatus) => {
    try {
      await updateLeadStatus(leadId, newStatus);
      message.success("Lead progress updated");
      fetchLeads();
    } catch (error) {
      message.error("Failed to update lead progress");
    }
  };

  if (!hasActivePlan && !loading) {
    return <Navigate to="/seller/upgrade-plan" replace />;
  }

  const availableLeads = leads.filter(l => l.status === "pending");
  const myLeads = leads.filter(l => l.isAcceptedByMe);
  const closedLeads = leads.filter(l => l.status !== "pending" && !l.isAcceptedByMe);

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div className="max-w-full overflow-hidden">
          <Title level={3} className="m-0! flex items-center gap-2 text-xl sm:text-2xl">
            <ClipboardList size={28} className="text-indigo-600 shrink-0" />
            <span className="truncate">Leads Overview</span>
          </Title>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">View and manage shared property requirements from the admin.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {subscription && (
            <div className="flex items-center bg-white px-3 sm:px-4 py-2 rounded-2xl shadow-sm border border-slate-100 transition-all hover:border-indigo-100 group">
              <div className="flex flex-col items-end mr-3 sm:mr-4 border-r pr-3 sm:pr-4 border-slate-100">
                <Text className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-1">Balance</Text>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <Title level={4} className="m-0! text-slate-900 font-bold text-sm sm:text-base">
                    {subscription.plan?.leadsLimit === -1 ? '∞' : (subscription.plan?.leadsLimit || 0) - (subscription.leadsUsed || 0)}
                  </Title>
                </div>
              </div>
              <div className="relative flex items-center justify-center">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 transform -rotate-90">
                  <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" fill="transparent" className="text-slate-100 sm:hidden" />
                  <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-slate-100 hidden sm:block" />
                  
                  <circle
                    cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" fill="transparent"
                    strokeDasharray={82}
                    strokeDashoffset={82 - (subscription.plan?.leadsLimit === -1 ? 82 : Math.round((((subscription.plan?.leadsLimit || 0) - (subscription.leadsUsed || 0)) / (subscription.plan?.leadsLimit || 1)) * 82))}
                    strokeLinecap="round"
                    className="text-indigo-600 transition-all duration-1000 sm:hidden"
                  />
                  <circle
                    cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent"
                    strokeDasharray={100}
                    strokeDashoffset={100 - (subscription.plan?.leadsLimit === -1 ? 100 : Math.round((((subscription.plan?.leadsLimit || 0) - (subscription.leadsUsed || 0)) / (subscription.plan?.leadsLimit || 1)) * 100))}
                    strokeLinecap="round"
                    className="text-indigo-600 transition-all duration-1000 hidden sm:block"
                  />
                </svg>
                <span className="absolute text-[8px] sm:text-[10px] font-black text-indigo-600">
                  {subscription.plan?.leadsLimit === -1 ? '∞' : Math.round((((subscription.plan?.leadsLimit || 0) - (subscription.leadsUsed || 0)) / (subscription.plan?.leadsLimit || 1)) * 100)}%
                </span>
              </div>
            </div>
          )}
          <Button 
            icon={<LayoutDashboard size={16} />} 
            onClick={fetchLeads}
            loading={loading}
            className="rounded-xl h-10 font-semibold px-3 sm:px-4 text-xs sm:text-sm flex-1 sm:flex-initial"
          >
            Refresh
          </Button>
        </div>
      </div>

      <Tabs
        defaultActiveKey="available"
        className="custom-leads-tabs"
        items={[
          {
            key: "available",
            label: (
              <span className="flex items-center gap-2 px-2 py-1">
                Available Leads
                <Badge count={availableLeads.length} overflowCount={99} className="scale-75 translate-x-1" style={{ backgroundColor: '#6366f1' }} />
              </span>
            ),
            children: (
              <div className="mt-4">
                {loading && leads.length === 0 ? (
                   <div className="relative flex flex-col items-center justify-center py-40 bg-white rounded-3xl shadow-sm border border-slate-100 min-h-[400px] overflow-hidden w-full">
                   <Loader variant="panel" />
                   <p className="mt-40 text-slate-500 font-medium relative z-10">Checking for new leads...</p>
                 </div>
                ) : availableLeads.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                      <MessageSquare size={32} className="text-slate-300" />
                    </div>
                    <Title level={4} className="text-slate-900 font-bold mb-2">No leads available</Title>
                    <Text className="text-slate-500 max-w-sm mx-auto block">
                      We&apos;ll notify you immediately when a new property requirement matches your profile.
                    </Text>
                  </div>
                ) : (
                  <div 
                    className="grid gap-4 sm:gap-6"
                    style={{ 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
                      alignItems: 'stretch'
                    }}
                  >
                    {availableLeads.map((lead) => (
                      <LeadCard 
                        key={lead._id}
                        lead={lead} 
                        onAccept={handleAcceptLead} 
                        onReject={handleRejectLead}
                        onStatusChange={handleStatusUpdate}
                        acceptingId={acceptingId} 
                        onExpire={fetchLeads}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          },
          {
            key: "myLeads",
            label: (
              <span className="flex items-center gap-2 px-2 py-1">
                My Accepted Leads
                <Badge count={myLeads.length} overflowCount={99} className="scale-75 translate-x-1" style={{ backgroundColor: '#10b981' }} />
              </span>
            ),
            children: (
              <div className="mt-4">
                {myLeads.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                      <ClipboardList size={32} className="text-slate-300" />
                    </div>
                    <Title level={4} className="text-slate-900 font-bold mb-2">No accepted leads yet</Title>
                    <Text className="text-slate-500 max-w-sm mx-auto block">
                      Once you accept a lead from the &quot;Available&quot; tab, it will appear here with full contact details.
                    </Text>
                  </div>
                ) : (
                  <div 
                    className="grid gap-4 sm:gap-6"
                    style={{ 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
                      alignItems: 'stretch'
                    }}
                  >
                    {myLeads.map((lead) => (
                      <LeadCard 
                        key={lead._id}
                        lead={lead} 
                        onAccept={handleAcceptLead} 
                        onReject={handleRejectLead}
                        onStatusChange={handleStatusUpdate}
                        acceptingId={acceptingId} 
                        onExpire={fetchLeads}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          },
          {
            key: "closed",
            label: (
              <span className="flex items-center gap-2 px-2 py-1">
                History / Closed
                <Badge count={closedLeads.length} overflowCount={99} className="scale-75 translate-x-1" style={{ backgroundColor: '#ef4444' }} />
              </span>
            ),
            children: (
              <div className="mt-4">
                {closedLeads.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                      <Clock size={32} className="text-slate-300" />
                    </div>
                    <Title level={4} className="text-slate-900 font-bold mb-2">History is empty</Title>
                    <Text className="text-slate-500 max-w-sm mx-auto block">
                      Leads that have expired or been closed will be moved here for your records.
                    </Text>
                  </div>
                ) : (
                  <div 
                    className="grid gap-4 sm:gap-6"
                    style={{ 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
                      alignItems: 'stretch'
                    }}
                  >
                    {closedLeads.map((lead) => (
                      <LeadCard 
                        key={lead._id}
                        lead={lead} 
                        onAccept={handleAcceptLead} 
                        acceptingId={acceptingId} 
                        onExpire={fetchLeads}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          }
        ]}
      />

      <style>{`
        .custom-leads-tabs .ant-tabs-nav::before {
          border-bottom: 2px solid #f1f5f9;
        }
        .custom-leads-tabs .ant-tabs-tab {
          font-weight: 700 !important;
          font-size: 15px;
          color: #475569;
          transition: all 0.3s ease;
        }
        .custom-leads-tabs .ant-tabs-tab-active {
          transform: translateY(-1px);
        }
        .custom-leads-tabs .ant-tabs-ink-bar {
          height: 3px !important;
          background: #6366f1 !important;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default LeadsOverview;
