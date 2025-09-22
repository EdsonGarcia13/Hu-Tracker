export const mapSupabaseHuToUi = (hu, initiativeName = "") => {
  const original = Number(hu?.original_estimate ?? 0);
  const completed = Number(hu?.completed_work ?? 0);
  const sprintNumber =
    hu?.sprint !== undefined && hu?.sprint !== null
      ? Number(hu.sprint)
      : null;

  const mapped = {
    id: hu?.id || null,
    initiativeId: hu?.initiative_id || null,
    Title: hu?.title || "",
    State: hu?.state || "ToDo",
    "Assigned To": hu?.assigned_to || "",
    "Original Estimate": original,
    "Completed Work": completed,
    "Remaining Work":
      typeof hu?.remaining_work === "number"
        ? Number(hu.remaining_work)
        : Math.max(0, original - completed),
    "Start Date": hu?.start_date || "",
    "Due Date": hu?.due_date || "",
    Initiative: initiativeName,
    Sprint: sprintNumber !== null ? String(sprintNumber) : "",
    sprint: sprintNumber !== null ? sprintNumber : undefined,
    isAdditional: Boolean(hu?.is_additional),
  };

  if (hu?.completion_date) {
    mapped["Completion Date"] = hu.completion_date;
  }

  return mapped;
};

export const mapSupabaseInitiativeToUi = (initiative) => ({
  id: initiative?.id || null,
  name: initiative?.name || "",
  startDate: initiative?.start_date || "",
  dueDate: initiative?.due_date || "",
  sprintDays: initiative?.sprint_days ?? 0,
  stories: Array.isArray(initiative?.hus)
    ? initiative.hus.map((hu) => mapSupabaseHuToUi(hu, initiative?.name))
    : [],
});
