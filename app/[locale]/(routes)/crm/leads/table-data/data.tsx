import {
  CircleIcon,
  QuestionMarkCircledIcon,
  StopwatchIcon,
} from "@radix-ui/react-icons";

export const statuses = [
  { value: "NEW_LEAD", label: "New lead", icon: CircleIcon },
  { value: "OUTREACH_SENT", label: "Outreach sent", icon: CircleIcon },
  { value: "FOLLOW_UP_ONE", label: "Follow up -1", icon: CircleIcon },
  { value: "FOLLOW_UP_TWO", label: "Follow up -2", icon: CircleIcon },
  { value: "RESPONDED", label: "Responded", icon: CircleIcon },
  { value: "HANDED_TO_AE", label: "Handed to AE", icon: CircleIcon },
  { value: "IN_DEMO_PROCESS", label: "In Demo Process", icon: CircleIcon },
  { value: "QUALIFIED", label: "Qualified", icon: CircleIcon },
  { value: "FAIL_CLOSED", label: "Fail -Closed", icon: CircleIcon },
  { value: "SUCCESS_CLOSED", label: "Success -Closed", icon: CircleIcon },
];
