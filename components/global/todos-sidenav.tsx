"use client";
import {
  ChevronLeft,
  ChevronRight,
  Circle,
  CheckCircle2,
  FolderKanban,
  ListTodo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ManageProjectsModal } from "./manage-projects-modal";
import { useMain } from "@/services/hooks/useMain";
import { useTodo } from "@/services/hooks/useTodo";
import { useTask } from "@/services/hooks/useTask";
import {
  utcToLocalDateString,
  utcToLocalTimeString,
  dateToLocalDateString,
} from "@/lib/timezone-config";

interface Todo {
  id: string;
  title: string;
  project: string;
  projectTitle: string;
  courseCode: string | null;
  time: string;
  day?: string;
  completed: boolean;
  type: "todo" | "task";
  dueDate: string;
  colorHex: string | null;
  isOverdue?: boolean;
  groupIndex?: number;
}

interface TodosSidenavProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface DayGroup {
  day: string;
  date: string;
  todos: Todo[];
}

export default function TodosSidenav({
  isCollapsed,
  onToggle,
}: TodosSidenavProps) {
  console.log("[Todos Sidenav] Component rendering, isCollapsed:", isCollapsed);

  const { getDB } = useMain();
  const { completeTodo, updateTodos } = useTodo();
  const { completeTask, updateTask } = useTask();
  console.log("[Todos Sidenav] getDB function:", typeof getDB, getDB);

  const [todos, setTodos] = useState<DayGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"today" | "week" | "month">(
    "today"
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<"tasks" | "todos">(
    "todos"
  );
  const [currentMascot, setCurrentMascot] = useState<
    "neutral" | "celebration" | "panic"
  >("neutral");
  const [prevAllCompleted, setPrevAllCompleted] = useState(false);

  console.log("[Todos Sidenav] State:", {
    todosLength: todos.length,
    isLoading,
  });

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  // Format time for display (convert UTC to local timezone)
  const formatTime = (dueDate: string | undefined | null): string => {
    if (!dueDate) return "No time set";

    try {
      const time = utcToLocalTimeString(dueDate);
      const [hours, minutes] = time.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
    } catch (error) {
      console.error(
        "[Todos Sidenav] Error formatting time:",
        error,
        "dueDate:",
        dueDate
      );
      return "Invalid time";
    }
  };

  // Check if a todo/task is overdue
  const isOverdue = (
    dueDate: string | undefined | null,
    isSubmitted: boolean
  ): boolean => {
    if (!dueDate || isSubmitted) return false;

    try {
      const today = new Date();
      const todayStr = dateToLocalDateString(today);
      const dueLocalDate = utcToLocalDateString(dueDate);

      // Compare dates in local timezone
      return todayStr > dueLocalDate;
    } catch (error) {
      console.error(
        "[Todos Sidenav] Error checking overdue:",
        error,
        "dueDate:",
        dueDate
      );
      return false;
    }
  };

  // Get day label for a date
  const getDayLabel = (dateStr: string): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = dateToLocalDateString(today);
    const tomorrowStr = dateToLocalDateString(tomorrow);

    if (dateStr === todayStr) return "Today";
    if (dateStr === tomorrowStr) return "Tomorrow";
    return "This Week";
  };

  // Fetch data from IndexedDB
  const fetchData = async () => {
    setIsLoading(true);
    console.log("[Todos Sidenav] fetchData started");
    try {
      const db = getDB();
      console.log("[Todos Sidenav] Got DB instance");
      await db.init();
      console.log("[Todos Sidenav] DB initialized");

      console.log("[Todos Sidenav] Fetching data from IndexedDB...");

      const [fetchedTasks, fetchedTodos, fetchedProjects] = await Promise.all([
        db.getTasks(),
        db.getTodos(),
        db.getProjects(),
      ]);

      console.log("[Todos Sidenav] Fetched data:", {
        tasks: fetchedTasks.length,
        todos: fetchedTodos.length,
        projects: fetchedProjects.length,
      });

      // Log sample data
      if (fetchedTasks.length > 0) {
        console.log("[Todos Sidenav] Sample task:", fetchedTasks[0]);
      }
      if (fetchedTodos.length > 0) {
        console.log("[Todos Sidenav] Sample todo:", fetchedTodos[0]);
      }
      if (fetchedProjects.length > 0) {
        console.log("[Todos Sidenav] Sample project:", fetchedProjects[0]);
      }

      // Process tasks
      const formattedTasks: Todo[] = fetchedTasks.map((task: any) => {
        const project = fetchedProjects.find(
          (p: any) => p.id === task.project_id
        );

        const projectTitle = project?.title || project?.name || "General";
        const courseCode =
          project?.source === "Canvas" ? project?.course_code : null;
        const projectDisplay = courseCode ? courseCode : projectTitle;

        return {
          id: task.id,
          title: task.title || task.name || "Untitled Task",
          project: projectDisplay,
          projectTitle: projectTitle,
          courseCode: courseCode,
          time: formatTime(task.due_date || task.dueDate),
          completed: task.is_submitted || false,
          type: "task" as const,
          dueDate: task.due_date || task.dueDate,
          colorHex: project?.color_hex || null,
          isOverdue: isOverdue(
            task.due_date || task.dueDate,
            task.is_submitted || false
          ),
        };
      });

      // Process todos
      const formattedTodos: Todo[] = fetchedTodos.map((todo: any) => {
        const task = fetchedTasks.find((t: any) => t.id === todo.task_id);
        const project = task
          ? fetchedProjects.find((p: any) => p.id === task.project_id)
          : null;

        const projectTitle = project?.title || project?.name || "General";
        const courseCode =
          project?.source === "Canvas" ? project?.course_code : null;
        const projectDisplay = courseCode ? courseCode : projectTitle;

        // Use is_submitted (correct field name) instead of is_completed
        const isSubmitted = todo.is_submitted || false;

        return {
          id: todo.id,
          title: todo.title || todo.name || "Untitled Todo",
          project: projectDisplay,
          projectTitle: projectTitle,
          courseCode: courseCode,
          time: formatTime(todo.due_date || todo.dueDate),
          completed: isSubmitted,
          type: "todo" as const,
          dueDate: todo.due_date || todo.dueDate,
          colorHex: project?.color_hex || null,
          isOverdue: isOverdue(todo.due_date || todo.dueDate, isSubmitted),
        };
      });

      // Combine and filter out items without due dates, then sort by due date
      const allItems = [...formattedTasks, ...formattedTodos]
        .filter((item) => item.dueDate) // Only include items with a due date
        .sort((a, b) => {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });

      console.log(
        "[Todos Sidenav] Total items after formatting:",
        allItems.length
      );
      console.log(
        "[Todos Sidenav] Items with due dates:",
        allItems.length,
        "/ Total:",
        formattedTasks.length + formattedTodos.length
      );
      if (allItems.length > 0) {
        console.log("[Todos Sidenav] Sample formatted item:", allItems[0]);
      }

      // Group by day
      const today = new Date();
      const todayStr = dateToLocalDateString(today);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = dateToLocalDateString(tomorrow);
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekEndStr = dateToLocalDateString(weekEnd);

      const todayGroup: DayGroup = {
        day: "Today",
        date: formatDate(today),
        todos: [],
      };

      const tomorrowGroup: DayGroup = {
        day: "Tomorrow",
        date: formatDate(tomorrow),
        todos: [],
      };

      const thisWeekGroup: DayGroup = {
        day: "This Week",
        date: `${formatDate(
          new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)
        )} - ${formatDate(weekEnd)}`,
        todos: [],
      };

      console.log("[Todos Sidenav] Date strings:", {
        today: todayStr,
        tomorrow: tomorrowStr,
        weekEnd: weekEndStr,
      });

      allItems.forEach((item) => {
        const itemLocalDate = utcToLocalDateString(item.dueDate);
        console.log(
          `[Todos Sidenav] Item "${item.title}" date: ${itemLocalDate}`
        );

        if (itemLocalDate === todayStr) {
          todayGroup.todos.push(item);
          console.log(`  -> Added to TODAY`);
        } else if (itemLocalDate === tomorrowStr) {
          tomorrowGroup.todos.push(item);
          console.log(`  -> Added to TOMORROW`);
        } else if (itemLocalDate <= weekEndStr) {
          thisWeekGroup.todos.push(item);
          console.log(`  -> Added to THIS WEEK`);
        } else {
          console.log(
            `  -> NOT ADDED (date ${itemLocalDate} is after ${weekEndStr})`
          );
        }
      });

      const groups: DayGroup[] = [];
      if (todayGroup.todos.length > 0) groups.push(todayGroup);
      if (tomorrowGroup.todos.length > 0) groups.push(tomorrowGroup);
      if (thisWeekGroup.todos.length > 0) groups.push(thisWeekGroup);

      console.log("[Todos Sidenav] Group counts:", {
        today: todayGroup.todos.length,
        tomorrow: tomorrowGroup.todos.length,
        thisWeek: thisWeekGroup.todos.length,
        totalGroups: groups.length,
      });

      setTodos(groups);

      console.log("[Todos Sidenav] Data loaded successfully (Timezone: UTC+2)");
      console.log(
        "[Todos Sidenav] Final state set with groups:",
        groups.length
      );
    } catch (error) {
      console.error("[Todos Sidenav] Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    console.log("[Todos Sidenav] useEffect triggered!");
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Extract all overdue items
  const overdueTodos = todos.flatMap((group, groupIndex) =>
    group.todos
      .filter((todo) => todo.isOverdue)
      .map((todo) => ({ ...todo, day: group.day, groupIndex }))
  );

  // Calculate today's progress
  const todayTodos = todos.find((g) => g.day === "Today")?.todos || [];
  const completedToday = todayTodos.filter((todo) => todo.completed).length;
  const totalToday = todayTodos.length;
  const allTasksCompleted = totalToday > 0 && completedToday === totalToday;
  const hasOverdueTasks = overdueTodos.length > 0;

  // Mascot GIF logic - Celebration (takes priority)
  useEffect(() => {
    // Only show celebration when transitioning from not-completed to all-completed
    if (allTasksCompleted && totalToday > 0 && !prevAllCompleted) {
      setCurrentMascot("celebration");
      const celebrationTimer = setTimeout(() => {
        setCurrentMascot("neutral");
      }, 10000);
      setPrevAllCompleted(true);
      return () => clearTimeout(celebrationTimer);
    } else if (!allTasksCompleted) {
      // Reset the previous state when tasks become incomplete again
      setPrevAllCompleted(false);
    }
  }, [allTasksCompleted, totalToday, prevAllCompleted]);

  // Overdue tasks logic - show panic gif for 5 seconds, loop every 30 minutes
  const panicTimersRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Clear any existing timers
    panicTimersRef.current.forEach((timer) => clearTimeout(timer));
    panicTimersRef.current = [];

    if (!hasOverdueTasks) {
      // If no overdue tasks, ensure we're not showing panic
      setCurrentMascot((prev) => (prev === "panic" ? "neutral" : prev));
      return;
    }

    const cyclePanic = () => {
      // Show panic (only if not celebrating)
      setCurrentMascot((prev) => {
        if (prev === "celebration") return prev;
        return "panic";
      });

      // After 5 seconds, return to neutral
      const panicTimer = setTimeout(() => {
        setCurrentMascot((prev) => {
          if (prev === "celebration") return prev;
          return "neutral";
        });

        // After 30 minutes total (from the start of this cycle), show panic again
        const nextPanicTimer = setTimeout(() => {
          cyclePanic();
        }, 30 * 60 * 1000 - 10000); // 30 minutes minus the 5 seconds we just waited

        panicTimersRef.current.push(nextPanicTimer);
      }, 5000);

      panicTimersRef.current.push(panicTimer);
    };

    // Start the cycle immediately
    cyclePanic();

    return () => {
      panicTimersRef.current.forEach((timer) => clearTimeout(timer));
      panicTimersRef.current = [];
    };
  }, [hasOverdueTasks]);

  const toggleTodoComplete = async (
    dayIndex: number,
    todoId: string,
    todoType: "todo" | "task"
  ) => {
    // Find the current todo/task to check its completion status
    // Search in all groups (not just filtered) to handle overdue items
    const allTodos = todos.flatMap((group) => group.todos);
    const currentTodo = allTodos.find((todo) => todo.id === todoId);

    if (!currentTodo) {
      console.error("[Todos Sidenav] Todo/task not found:", todoId);
      return;
    }

    const isCurrentlyCompleted = currentTodo.completed;
    const newCompletedState = !isCurrentlyCompleted;

    // Find the actual group index in the todos array
    // This handles cases where the item might be in a different group than expected
    let actualGroupIndex = dayIndex;
    for (let i = 0; i < todos.length; i++) {
      if (todos[i].todos.some((todo) => todo.id === todoId)) {
        actualGroupIndex = i;
        break;
      }
    }

    try {
      // Step 1: Optimistically update UI immediately for better UX
      setTodos((prev) =>
        prev.map((group, idx) =>
          idx === actualGroupIndex
            ? {
                ...group,
                todos: group.todos.map((todo) =>
                  todo.id === todoId
                    ? { ...todo, completed: newCompletedState }
                    : todo
                ),
              }
            : group
        )
      );

      // Step 2: Update IndexedDB optimistically (before backend call)
      const db = getDB();
      await db.init();

      if (todoType === "todo") {
        // Get current todo from IndexedDB
        const todos = await db.getTodos();
        const todo = todos.find((t: any) => t.id === todoId);
        if (todo) {
          // Update IndexedDB optimistically
          await db.saveTodo({
            ...todo,
            is_submitted: newCompletedState,
          });
        }
      } else if (todoType === "task") {
        // Get current task from IndexedDB
        const tasks = await db.getTasks();
        const task = tasks.find((t: any) => t.id === todoId);
        if (task) {
          // Update IndexedDB optimistically
          await db.saveTask({
            ...task,
            is_submitted: newCompletedState,
          });
        }
      }

      // Step 3: Call backend API to complete/uncomplete
      let response;
      if (todoType === "todo") {
        if (isCurrentlyCompleted) {
          // Uncomplete todo - use updateTodos with is_submitted: false
          response = await updateTodos([todoId], { is_submitted: false });
        } else {
          // Complete todo
          response = await completeTodo(todoId);
        }
      } else if (todoType === "task") {
        if (isCurrentlyCompleted) {
          // Uncomplete task - use updateTask with is_submitted: false
          response = await updateTask(todoId, { is_submitted: false });
        } else {
          // Complete task
          response = await completeTask(todoId);
        }
      }

      // Step 4: Handle response
      if (response && response.success) {
        // Backend succeeded - hooks already updated IndexedDB with server response
        // Refresh data from IndexedDB to ensure we have the latest state
        // Use a small delay to avoid race conditions with hook updates
        setTimeout(async () => {
          await fetchData();
        }, 100);
      } else {
        // Backend failed - revert IndexedDB and UI
        console.error("[Todos Sidenav] Backend call failed, reverting changes");

        // Revert IndexedDB
        const db = getDB();
        await db.init();

        if (todoType === "todo") {
          const todos = await db.getTodos();
          const todo = todos.find((t: any) => t.id === todoId);
          if (todo) {
            await db.saveTodo({
              ...todo,
              is_submitted: isCurrentlyCompleted,
            });
          }
        } else if (todoType === "task") {
          const tasks = await db.getTasks();
          const task = tasks.find((t: any) => t.id === todoId);
          if (task) {
            await db.saveTask({
              ...task,
              is_submitted: isCurrentlyCompleted,
            });
          }
        }

        // Revert UI
        setTodos((prev) =>
          prev.map((group, idx) =>
            idx === actualGroupIndex
              ? {
                  ...group,
                  todos: group.todos.map((todo) =>
                    todo.id === todoId
                      ? { ...todo, completed: isCurrentlyCompleted }
                      : todo
                  ),
                }
              : group
          )
        );
      }
    } catch (error) {
      console.error(
        "[Todos Sidenav] Error toggling todo/task completion:",
        error
      );

      // Revert IndexedDB on error
      try {
        const db = getDB();
        await db.init();

        if (todoType === "todo") {
          const todos = await db.getTodos();
          const todo = todos.find((t: any) => t.id === todoId);
          if (todo) {
            await db.saveTodo({
              ...todo,
              is_submitted: isCurrentlyCompleted,
            });
          }
        } else if (todoType === "task") {
          const tasks = await db.getTasks();
          const task = tasks.find((t: any) => t.id === todoId);
          if (task) {
            await db.saveTask({
              ...task,
              is_submitted: isCurrentlyCompleted,
            });
          }
        }
      } catch (revertError) {
        console.error(
          "[Todos Sidenav] Error reverting IndexedDB:",
          revertError
        );
      }

      // Revert UI
      setTodos((prev) =>
        prev.map((group, idx) =>
          idx === actualGroupIndex
            ? {
                ...group,
                todos: group.todos.map((todo) =>
                  todo.id === todoId
                    ? { ...todo, completed: isCurrentlyCompleted }
                    : todo
                ),
              }
            : group
        )
      );
    }
  };

  const progressPercentage =
    totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

  // Get the current mascot GIF path
  const getMascotGif = () => {
    switch (currentMascot) {
      case "celebration":
        return "/mascot/Noki_Celebration.gif";
      case "panic":
        return "/mascot/Noki_Panic.gif";
      default:
        return "/mascot/Noki_Neutral.gif";
    }
  };

  // Filter todos based on active filter
  const filteredTodos = todos
    .filter((group) => {
      if (activeFilter === "today") return group.day === "Today";
      if (activeFilter === "week")
        return (
          group.day === "Today" ||
          group.day === "Tomorrow" ||
          group.day === "This Week"
        );
      return true;
    })
    .map((group) => ({
      ...group,
      todos: group.todos.filter((todo) => !todo.isOverdue),
    }))
    .filter((group) => group.todos.length > 0);

  const handleCreateTask = () => {
    setModalInitialTab("tasks");
    setIsModalOpen(true);
  };

  const handleCreateTodo = () => {
    setModalInitialTab("todos");
    setIsModalOpen(true);
  };

  return (
    <>
      {/* Desktop Sidenav */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-card border-l border-border transition-all duration-300 ease-in-out h-screen fixed right-0 top-0 z-30",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-card border-b border-border z-10">
          <div
            className={cn(
              "relative overflow-hidden bg-noki-primary",
              isCollapsed ? "h-12" : "h-32"
            )}
          >
            <div className="w-full h-full flex items-center justify-center relative">
              <Image
                src={getMascotGif()}
                alt="Noki mascot"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>

          {!isCollapsed && (
            <div className="px-4 py-4">
              <h2 className="font-poppins font-bold text-xl text-noki-primary">
                Todos
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your upcoming tasks
              </p>

              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-roboto">
                    Today's Progress
                  </span>
                  <span className="text-foreground font-medium font-roboto">
                    {completedToday}/{totalToday}
                  </span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-noki-primary rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-noki-primary font-medium font-roboto text-right">
                  {Math.round(progressPercentage)}% complete
                </p>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setActiveFilter("today")}
                  className={cn(
                    "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium font-roboto transition-all",
                    activeFilter === "today"
                      ? "bg-noki-primary text-white shadow-sm"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  )}
                >
                  Today
                </button>
                <button
                  onClick={() => setActiveFilter("week")}
                  className={cn(
                    "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium font-roboto transition-all",
                    activeFilter === "week"
                      ? "bg-noki-primary text-white shadow-sm"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  )}
                >
                  Week
                </button>
                <button
                  onClick={() => setActiveFilter("month")}
                  className={cn(
                    "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium font-roboto transition-all",
                    activeFilter === "month"
                      ? "bg-noki-primary text-white shadow-sm"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  )}
                >
                  Month
                </button>
              </div>
            </div>
          )}

          {/* Toggle Button */}
          <button
            onClick={onToggle}
            className="absolute top-4 -left-3 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center hover:bg-secondary transition-colors shadow-sm"
            aria-label="Toggle todos sidebar"
          >
            {isCollapsed ? (
              <ChevronLeft className="w-4 h-4 text-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-foreground" />
            )}
          </button>
        </div>

        {/* Scrollable Todos Content */}
        <div className="flex-1 overflow-y-auto pb-20">
          {!isCollapsed ? (
            isLoading ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Loading todos...
              </div>
            ) : (
              <div className="p-3 space-y-5">
                {/* Overdue Section */}
                {overdueTodos.length > 0 && (
                  <div className="space-y-2">
                    <div className="sticky top-0 bg-card px-1 py-2 z-10 border-b border-red-500/50">
                      <div className="font-poppins font-semibold text-sm text-red-500 flex items-center gap-2">
                        <span>Overdue</span>
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                          {overdueTodos.length}
                        </span>
                      </div>
                      <div className="text-xs text-red-400 mt-0.5">
                        Needs immediate attention
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {overdueTodos.map((todo) => {
                        // Find the correct group index for overdue items
                        const groupIndex = todos.findIndex(
                          (group) => group.day === todo.day
                        );
                        const safeGroupIndex = groupIndex >= 0 ? groupIndex : 0;

                        return (
                          <div
                            key={todo.id}
                            onClick={() =>
                              toggleTodoComplete(
                                safeGroupIndex,
                                todo.id,
                                todo.type
                              )
                            }
                            className="group p-2 rounded-lg border-2 border-red-500 bg-red-500/10 hover:bg-red-500/20 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-200 cursor-pointer"
                          >
                            <div className="flex items-start gap-2">
                              <Circle className="w-4 h-4 text-red-500 group-hover:text-red-600 transition-colors flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  {todo.type === "task" ? (
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/30 rounded text-[9px] font-medium text-red-600">
                                      <FolderKanban className="w-2.5 h-2.5" />
                                      <span className="pt-0.5">TASK</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/30 rounded text-[9px] font-medium text-red-600">
                                      <ListTodo className="w-2.5 h-2.5" />
                                      <span className="pt-0.5">TODO</span>
                                    </div>
                                  )}
                                </div>
                                <h4 className="font-roboto font-medium text-xs line-clamp-2 text-red-600 group-hover:text-red-700 transition-colors">
                                  {todo.title}
                                </h4>
                                <p className="text-[10px] text-red-500/80 mt-1 truncate font-roboto">
                                  {todo.project}
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                  <div className="w-1 h-1 rounded-full bg-red-500" />
                                  <p className="text-[10px] text-red-600 font-medium font-roboto">
                                    {todo.time}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Regular Todos */}
                {filteredTodos.length === 0 && overdueTodos.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No todos or tasks found
                  </div>
                ) : (
                  filteredTodos.map((group, groupIndex) => (
                    <div key={group.day} className="space-y-2">
                      <div className="sticky top-0 bg-card px-1 py-2 z-10 border-b border-border/50">
                        <div className="font-poppins font-semibold text-sm text-foreground">
                          {group.day}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {group.date}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {group.todos.map((todo) => (
                          <div
                            key={todo.id}
                            onClick={() =>
                              toggleTodoComplete(groupIndex, todo.id, todo.type)
                            }
                            className={cn(
                              "group p-2 rounded-lg border transition-all duration-200 cursor-pointer",
                              todo.completed
                                ? "bg-secondary border-border opacity-60"
                                : "bg-card border-border hover:shadow-sm"
                            )}
                            style={{
                              ...(todo.type === "task" &&
                              !todo.completed &&
                              todo.colorHex
                                ? {
                                    backgroundColor: `${todo.colorHex}30`, // 30 = ~19% opacity
                                    borderColor: todo.colorHex,
                                  }
                                : todo.type === "todo" &&
                                  !todo.completed &&
                                  todo.colorHex
                                ? {
                                    borderColor: todo.colorHex,
                                    borderWidth: "2px",
                                  }
                                : {}),
                            }}
                          >
                            <div className="flex items-start gap-2">
                              {todo.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-noki-primary flex-shrink-0 mt-0.5" />
                              ) : (
                                <Circle
                                  className="w-4 h-4 group-hover:text-noki-primary transition-colors flex-shrink-0 mt-0.5"
                                  style={{
                                    color: todo.colorHex || undefined,
                                  }}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  {todo.type === "task" ? (
                                    <div
                                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium"
                                      style={{
                                        backgroundColor: todo.colorHex
                                          ? `${todo.colorHex}30`
                                          : undefined,
                                        color: todo.colorHex || undefined,
                                      }}
                                    >
                                      <FolderKanban className="w-2.5 h-2.5" />
                                      <span className="pt-0.5">TASK</span>
                                    </div>
                                  ) : (
                                    <div
                                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium"
                                      style={{
                                        backgroundColor: todo.colorHex
                                          ? `${todo.colorHex}20`
                                          : undefined,
                                        color: todo.colorHex || undefined,
                                      }}
                                    >
                                      <ListTodo className="w-2.5 h-2.5" />
                                      <span className="pt-0.5">TODO</span>
                                    </div>
                                  )}
                                </div>
                                <h4
                                  className={cn(
                                    "font-roboto font-medium text-xs line-clamp-2 transition-colors",
                                    todo.completed
                                      ? "text-muted-foreground line-through"
                                      : "text-foreground group-hover:text-noki-primary"
                                  )}
                                >
                                  {todo.title}
                                </h4>
                                <p className="text-[10px] text-muted-foreground mt-1 truncate font-roboto">
                                  {todo.project}
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                  <div
                                    className="w-1 h-1 rounded-full"
                                    style={{
                                      backgroundColor:
                                        todo.colorHex || "#6366f1",
                                    }}
                                  />
                                  <p className="text-[10px] text-foreground font-medium font-roboto">
                                    {todo.time}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )
          ) : (
            <div className="p-2 space-y-6 mt-4">
              {todos.map((group) => (
                <div key={group.day} className="space-y-2">
                  <div className="w-1 h-1 rounded-full bg-muted-foreground mx-auto" />
                  {group.todos.map((todo) => (
                    <div
                      key={todo.id}
                      className={cn(
                        "w-2 h-2 rounded-full mx-auto hover:scale-125 transition-transform cursor-pointer",
                        todo.completed
                          ? "bg-muted-foreground"
                          : "bg-noki-primary"
                      )}
                      title={todo.title}
                      style={{
                        backgroundColor:
                          !todo.completed && todo.colorHex
                            ? todo.colorHex
                            : undefined,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {!isCollapsed && (
          <div className="fixed bottom-0 right-0 w-64 bg-card border-t border-border p-3 z-50">
            <div className="flex gap-2">
              <button
                className="group/create flex-1 h-12 flex items-center justify-center cursor-pointer hover:bg-cyan-500/5 rounded-lg transition-all"
                onClick={handleCreateTask}
              >
                <div className="px-4 py-2 rounded-lg border-2 border-dashed border-cyan-500/30 bg-cyan-500/5 group-hover/create:bg-cyan-500/10 group-hover/create:border-cyan-500/50 transition-all duration-200">
                  <div className="text-xs font-medium text-cyan-600 font-roboto">
                    + Create Task
                  </div>
                </div>
              </button>
              <button
                className="group/create flex-1 h-12 flex items-center justify-center cursor-pointer hover:bg-noki-primary/5 rounded-lg transition-all"
                onClick={handleCreateTodo}
              >
                <div className="px-4 py-2 rounded-lg border-2 border-dashed border-noki-primary/30 bg-noki-primary/5 group-hover/create:bg-noki-primary/10 group-hover/create:border-noki-primary/50 transition-all duration-200">
                  <div className="text-xs font-medium text-noki-primary font-roboto">
                    + Create Todo
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onToggle}
          aria-label="Close todos sidebar"
        />
      )}

      {/* Mobile Sidenav - Simplified version, similar structure to desktop */}
      <aside
        className={cn(
          "md:hidden fixed right-0 top-0 h-screen w-80 bg-card border-l border-border z-50 transition-transform duration-300 ease-in-out flex flex-col",
          isCollapsed ? "translate-x-full" : "translate-x-0"
        )}
      >
        {/* Use same content as desktop */}
        <div className="sticky top-0 bg-card border-b border-border z-10">
          <div className="relative h-24 overflow-hidden bg-noki-primary">
            <div className="w-full h-full flex items-center justify-center relative">
              <Image
                src={getMascotGif()}
                alt="Noki mascot"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>

          <div className="px-4 py-4">
            <h2 className="font-poppins font-bold text-xl text-noki-primary">
              Todos
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your upcoming tasks
            </p>

            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-roboto">
                  Today's Progress
                </span>
                <span className="text-foreground font-medium font-roboto">
                  {completedToday}/{totalToday}
                </span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-noki-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-xs text-noki-primary font-medium font-roboto text-right">
                {Math.round(progressPercentage)}% complete
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setActiveFilter("today")}
                className={cn(
                  "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium font-roboto transition-all",
                  activeFilter === "today"
                    ? "bg-noki-primary text-white shadow-sm"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                )}
              >
                Today
              </button>
              <button
                onClick={() => setActiveFilter("week")}
                className={cn(
                  "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium font-roboto transition-all",
                  activeFilter === "week"
                    ? "bg-noki-primary text-white shadow-sm"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                )}
              >
                Week
              </button>
              <button
                onClick={() => setActiveFilter("month")}
                className={cn(
                  "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium font-roboto transition-all",
                  activeFilter === "month"
                    ? "bg-noki-primary text-white shadow-sm"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                )}
              >
                Month
              </button>
            </div>
          </div>

          <button
            onClick={onToggle}
            className="absolute top-4 right-4 w-8 h-8 bg-card rounded-full flex items-center justify-center hover:bg-secondary transition-colors shadow-sm"
            aria-label="Close todos sidebar"
          >
            <ChevronRight className="w-5 h-5 text-noki-primary" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-20">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Loading todos...
            </div>
          ) : (
            <div className="p-3 space-y-5">
              {overdueTodos.length > 0 && (
                <div className="space-y-2">
                  <div className="sticky top-0 bg-card px-1 py-2 z-10 border-b border-red-500/50">
                    <div className="font-poppins font-semibold text-sm text-red-500 flex items-center gap-2">
                      <span>Overdue</span>
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                        {overdueTodos.length}
                      </span>
                    </div>
                  </div>
                  {/* Same overdue rendering as desktop */}
                </div>
              )}

              {filteredTodos.length === 0 && overdueTodos.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No todos or tasks found
                </div>
              ) : (
                filteredTodos.map((group, groupIndex) => (
                  <div key={group.day} className="space-y-2">
                    <div className="sticky top-0 bg-card px-1 py-2 z-10 border-b border-border/50">
                      <div className="font-poppins font-semibold text-sm text-foreground">
                        {group.day}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {group.date}
                      </div>
                    </div>
                    {/* Same todo rendering as desktop */}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 right-0 w-80 bg-card border-t border-border p-3 z-[1000]">
          <div className="flex gap-2">
            <button
              className="group/create flex-1 h-12 flex items-center justify-center cursor-pointer hover:bg-cyan-500/5 rounded-lg transition-all"
              onClick={handleCreateTask}
            >
              <div className="px-4 py-2 rounded-lg border-2 border-dashed border-cyan-500/30 bg-cyan-500/5 group-hover/create:bg-cyan-500/10 group-hover/create:border-cyan-500/50 transition-all duration-200">
                <div className="text-xs font-medium text-cyan-600 font-roboto">
                  + Create Task
                </div>
              </div>
            </button>
            <button
              className="group/create flex-1 h-12 flex items-center justify-center cursor-pointer hover:bg-noki-primary/5 rounded-lg transition-all"
              onClick={handleCreateTodo}
            >
              <div className="px-4 py-2 rounded-lg border-2 border-dashed border-noki-primary/30 bg-noki-primary/5 group-hover/create:bg-noki-primary/10 group-hover/create:border-noki-primary/50 transition-all duration-200">
                <div className="text-xs font-medium text-noki-primary font-roboto">
                  + Create Todo
                </div>
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* ManageProjectsModal Component */}
      <ManageProjectsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTab={modalInitialTab}
      />
    </>
  );
}
