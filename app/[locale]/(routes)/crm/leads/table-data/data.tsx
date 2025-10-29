import {
  CircleIcon,
  QuestionMarkCircledIcon,
  StopwatchIcon,
} from "@radix-ui/react-icons";

export const statuses = [
  // New cold outreach stages
  {
    value: "COLD_OUTREACH_SENT",
    label: "Cold Outreach SENT",
    icon: CircleIcon,
  },
  {
    value: "FOLLOW_UP_ONE",
    label: "FOLLOW-UP-ONE",
    icon: CircleIcon,
  },
  {
    value: "FOLLOW_UP_TWO",
    label: "FOLLOW-UP-TWO",
    icon: CircleIcon,
  },
  {
    value: "RESPONDED",
    label: "RESPONDED",
    icon: CircleIcon,
  },
  {
    value: "HANDED_TO_AE",
    label: "HANDED TO AE",
    icon: CircleIcon,
  },
  {
    value: "IN_DEMO_PROCESS",
    label: "IN-DEMO PROCESS",
    icon: CircleIcon,
  },
  {
    value: "QUALIFIED",
    label: "QUALIFIED",
    icon: CircleIcon,
  },
  {
    value: "FAIL_CLOSED",
    label: "FAIL-CLOSED",
    icon: CircleIcon,
  },
  {
    value: "SUCCESS_CLOSED",
    label: "SUCCESS-CLOSED",
    icon: CircleIcon,
  },
  // Legacy statuses (for existing data)
  {
    value: "NEW",
    label: "New (Legacy)",
    icon: QuestionMarkCircledIcon,
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress (Legacy)",
    icon: StopwatchIcon,
  },
  {
    value: "COMPLETED",
    label: "Completed (Legacy)",
    icon: StopwatchIcon,
  },
];
