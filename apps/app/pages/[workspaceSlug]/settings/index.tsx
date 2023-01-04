import React, { useEffect, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/router";

import { useForm } from "react-hook-form";

import Dropzone from "react-dropzone";
// services
import workspaceService from "lib/services/workspace.service";
import fileServices from "lib/services/file.service";
// hoc
import withAuth from "lib/hoc/withAuthWrapper";
// layouts
import SettingsLayout from "layouts/settings-layout";
// hooks
import useUser from "lib/hooks/useUser";
import useToast from "lib/hooks/useToast";
// components
import ConfirmWorkspaceDeletion from "components/workspace/confirm-workspace-deletion";
// ui
import { Spinner, Button, Input, Select, BreadcrumbItem, Breadcrumbs } from "ui";
// types
import type { IWorkspace } from "types";
import { WORKSPACE_DETAILS } from "constants/fetch-keys";
import useSWR from "swr";

const defaultValues: Partial<IWorkspace> = {
  name: "",
};

const WorkspaceSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const {
    query: { workspaceSlug },
  } = useRouter();
  const { setToastAlert } = useToast();

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null)
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<IWorkspace>({
    defaultValues: { ...defaultValues, ...activeWorkspace },
  });

  useEffect(() => {
    activeWorkspace && reset({ ...activeWorkspace });
  }, [activeWorkspace, reset]);

  const onSubmit = async (formData: IWorkspace) => {
    if (!activeWorkspace) return;
    const payload: Partial<IWorkspace> = {
      logo: formData.logo,
      name: formData.name,
      company_size: formData.company_size,
    };
    await workspaceService
      .updateWorkspace(activeWorkspace.slug, payload)
      .then(async (res) => {
        // TODO: mutate workspaces list
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Workspace updated successfully",
        });
      })
      .catch((err) => console.log(err));
  };

  return (
    <SettingsLayout
      memberType={{
        isGuest: true,
        isMember: true,
        isOwner: true,
        isViewer: true,
      }}
      type="workspace"
      meta={{
        title: "Plane - Workspace Settings",
      }}
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title={`${activeWorkspace?.name ?? "Workspace"} Settings`} />
        </Breadcrumbs>
      }
    >
      <ConfirmWorkspaceDeletion
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
        data={activeWorkspace ?? null}
      />
      {activeWorkspace ? (
        <div className="space-y-8">
          <div>
            <h3 className="text-3xl font-bold leading-6 text-gray-900">General</h3>
            <p className="mt-4 text-sm text-gray-500">
              This information will be displayed to every member of the workspace.
            </p>
          </div>
          <div className="grid grid-cols-12 gap-x-16 gap-y-8">
            <div className="col-span-5 space-y-16">
              <div>
                <h4 className="text-md mb-1 leading-6 text-gray-900">Logo</h4>
                {/* <p className="text-sm text-gray-500 mb-3">Upload a logo for the workspace.</p> */}
                <div className="flex w-full gap-2">
                  <Dropzone
                    multiple={false}
                    accept={{
                      "image/*": [],
                    }}
                    onDrop={(files) => {
                      setImage(files[0]);
                    }}
                  >
                    {({ getRootProps, getInputProps }) => (
                      <div>
                        <input {...getInputProps()} />
                        <div>
                          <div
                            className="grid w-16 place-items-center rounded-md border p-2"
                            {...getRootProps()}
                          >
                            {((watch("logo") && watch("logo") !== null && watch("logo") !== "") ||
                              (image && image !== null)) && (
                              <div className="relative mx-auto flex h-12 w-12">
                                <Image
                                  src={image ? URL.createObjectURL(image) : watch("logo") ?? ""}
                                  alt="Workspace Logo"
                                  objectFit="cover"
                                  layout="fill"
                                  priority
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Dropzone>
                  <div>
                    <p className="mb-2 text-sm text-gray-500">
                      Max file size is 500kb. Supported file types are .jpg and .png.
                    </p>
                    <Button
                      onClick={() => {
                        if (image === null) return;
                        setIsImageUploading(true);
                        const formData = new FormData();
                        formData.append("asset", image);
                        formData.append("attributes", JSON.stringify({}));
                        fileServices
                          .uploadFile(formData)
                          .then((response) => {
                            const imageUrl = response.asset;
                            setValue("logo", imageUrl);
                            handleSubmit(onSubmit)();
                            setIsImageUploading(false);
                          })
                          .catch((err) => {
                            setIsImageUploading(false);
                          });
                      }}
                    >
                      {isImageUploading ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-md mb-1 leading-6 text-gray-900">URL</h4>
                <p className="mb-3 text-sm text-gray-500">Give a name to your workspace.</p>
                <Input
                  id="url"
                  name="url"
                  autoComplete="off"
                  register={register}
                  error={errors.name}
                  validations={{
                    required: "Name is required",
                  }}
                  className="w-full"
                  value={`app.plane.so/${activeWorkspace.slug}`}
                  size="lg"
                />
              </div>
            </div>
            <div className="col-span-5 space-y-16">
              <div>
                <h4 className="text-md mb-1 leading-6 text-gray-900">Name</h4>
                <p className="mb-3 text-sm text-gray-500">Give a name to your workspace.</p>
                <Input
                  id="name"
                  name="name"
                  placeholder="Name"
                  autoComplete="off"
                  register={register}
                  error={errors.name}
                  validations={{
                    required: "Name is required",
                  }}
                  className="w-full"
                  size="lg"
                />
              </div>
              <div>
                <h4 className="text-md mb-1 leading-6 text-gray-900">Company Size</h4>
                <p className="mb-3 text-sm text-gray-500">How big is your company?</p>
                <Select
                  id="company_size"
                  name="company_size"
                  options={[
                    { value: 5, label: "5" },
                    { value: 10, label: "10" },
                    { value: 25, label: "25" },
                    { value: 50, label: "50" },
                  ]}
                  size="lg"
                  className="w-full"
                />
              </div>
            </div>
            <div className="col-span-full">
              <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Workspace"}
              </Button>
            </div>
            <div className="col-span-10 space-y-8">
              <div>
                <h4 className="text-md mb-1 leading-6 text-gray-900">Danger Zone</h4>
                <p className="mb-3 text-sm text-gray-500">
                  The danger zone of the workspace delete page is a critical area that requires
                  careful consideration and attention. When deleting a workspace, all of the data
                  and resources within that workspace will be permanently removed and cannot be
                  recovered.
                </p>
              </div>
              <div>
                <Button theme="danger" onClick={() => setIsOpen(true)}>
                  Delete the workspace
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid h-full w-full place-items-center px-4 sm:px-0">
          <Spinner />
        </div>
      )}
    </SettingsLayout>
  );
};

export default withAuth(WorkspaceSettings);