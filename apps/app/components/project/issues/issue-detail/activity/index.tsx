import React from "react";

import Image from "next/image";
import { useRouter } from "next/router";

import useSWR from "swr";

// fetch-keys
import { PROJECT_ISSUES_ACTIVITY, STATE_LIST, PROJECT_ISSUES_LIST } from "constants/fetch-keys";
// common
import { addSpaceIfCamelCase, timeAgo } from "constants/common";
// services
import stateService from "lib/services/state.service";
import issuesServices from "lib/services/issues.service";
// hooks
import useUser from "lib/hooks/useUser";
// ui
import { Loader } from "ui";
// icons
import {
  CalendarDaysIcon,
  ChartBarIcon,
  ChatBubbleBottomCenterTextIcon,
  Squares2X2Icon,
  UserIcon,
} from "@heroicons/react/24/outline";

const activityIcons: {
  [key: string]: JSX.Element;
} = {
  state: <Squares2X2Icon className="h-3.5 w-3.5" />,
  priority: <ChartBarIcon className="h-3.5 w-3.5" />,
  name: <ChatBubbleBottomCenterTextIcon className="h-3.5 w-3.5" />,
  description: <ChatBubbleBottomCenterTextIcon className="h-3.5 w-3.5" />,
  target_date: <CalendarDaysIcon className="h-3.5 w-3.5" />,
  parent: <UserIcon className="h-3.5 w-3.5" />,
};

const IssueActivitySection: React.FC = () => {
  const router = useRouter();

  const { workspaceSlug, projectId, issueId } = router.query;

  const { data: issues } = useSWR(
    workspaceSlug && projectId
      ? PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string)
      : null,
    workspaceSlug && projectId
      ? () => issuesServices.getIssues(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: issueActivities } = useSWR<any[]>(
    workspaceSlug && projectId && issueId ? PROJECT_ISSUES_ACTIVITY : null,
    workspaceSlug && projectId && issueId
      ? () =>
          issuesServices.getIssueActivities(
            workspaceSlug as string,
            projectId as string,
            issueId as string
          )
      : null
  );

  const { data: states } = useSWR(
    workspaceSlug && projectId ? STATE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );

  return (
    <>
      {issueActivities ? (
        <div className="space-y-3">
          {issueActivities.map((activity, index) => {
            if (activity.field !== "updated_by")
              return (
                <div key={activity.id} className="relative flex w-full gap-x-2">
                  {issueActivities.length > 1 && index !== issueActivities.length - 1 ? (
                    <span
                      className="absolute top-5 left-2.5 h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  {activity.field ? (
                    <div className="relative z-10 -ml-1 flex-shrink-0">
                      <div
                        className={`grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-gray-700 text-white`}
                      >
                        {activityIcons[activity.field as keyof typeof activityIcons]}
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10 -ml-1.5 h-[34px] flex-shrink-0 rounded-full border-2 border-white">
                      {activity.actor_detail.avatar && activity.actor_detail.avatar !== "" ? (
                        <Image
                          src={activity.actor_detail.avatar}
                          alt={activity.actor_detail.name}
                          height={30}
                          width={30}
                          className="rounded-full"
                        />
                      ) : (
                        <div
                          className={`grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-gray-700 text-white`}
                        >
                          {activity.actor_detail.first_name.charAt(0)}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="w-full text-xs">
                    <p>
                      <span className="font-medium">
                        {activity.actor_detail.first_name} {activity.actor_detail.last_name}
                      </span>
                      <span> {activity.verb} </span>
                      {activity.verb !== "created" ? (
                        <span>{activity.field ?? "commented"}</span>
                      ) : (
                        " this issue"
                      )}
                      <span className="ml-2 text-gray-500">{timeAgo(activity.created_at)}</span>
                    </p>
                    <div className="mt-2 w-full">
                      {activity.verb !== "created" && (
                        <div>
                          <div>
                            <span className="text-gray-500">From: </span>
                            {activity.field === "state"
                              ? activity.old_value
                                ? addSpaceIfCamelCase(
                                    states?.find((s) => s.id === activity.old_value)?.name ?? ""
                                  )
                                : "None"
                              : activity.field === "parent"
                              ? activity.old_value
                                ? issues?.results.find((i) => i.id === activity.old_value)?.name
                                : "None"
                              : activity.old_value ?? "None"}
                          </div>
                          <div>
                            <span className="text-gray-500">To: </span>
                            {activity.field === "state"
                              ? activity.new_value
                                ? addSpaceIfCamelCase(
                                    states?.find((s) => s.id === activity.new_value)?.name ?? ""
                                  )
                                : "None"
                              : activity.field === "parent"
                              ? activity.new_value
                                ? issues?.results.find((i) => i.id === activity.new_value)?.name
                                : "None"
                              : activity.new_value ?? "None"}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
          })}
        </div>
      ) : (
        <Loader className="space-y-4">
          <div className="space-y-2">
            <Loader.Item height="30px" width="40%"></Loader.Item>
            <Loader.Item height="15px" width="60%"></Loader.Item>
          </div>
          <div className="space-y-2">
            <Loader.Item height="30px" width="40%"></Loader.Item>
            <Loader.Item height="15px" width="60%"></Loader.Item>
          </div>
          <div className="space-y-2">
            <Loader.Item height="30px" width="40%"></Loader.Item>
            <Loader.Item height="15px" width="60%"></Loader.Item>
          </div>
        </Loader>
      )}
    </>
  );
};

export default IssueActivitySection;
