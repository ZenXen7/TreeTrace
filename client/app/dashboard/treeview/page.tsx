"use client";

import { useEffect, useState } from "react";
import FamilyTree from "@balkangraph/familytree.js";
import { motion } from "framer-motion";
import {
  handleAddMember,
  updateFamilyMember,
  deleteFamilyMember,
} from "./service/familyService";
import { useRouter } from "next/navigation";

function Familytree(props: {
  nodeBinding: any;
  nodes: any;
  fetchData: () => Promise<void>;
}) {
  useEffect(() => {
    const treeElement = document.getElementById("tree");
    if (treeElement) {
      // Define custom SVG templates for nodes
      const svgContent = `
<defs>
  <!-- Filter for card shadow -->
  <filter id="card-shadow" x="-10%" y="-10%" width="120%" height="120%">
    <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.4" floodColor="#000"/>
  </filter>
  
  <!-- Avatar circle clip path -->
  <clipPath id="avatar-clip">
    <circle cx="45" cy="50" r="32"/>
  </clipPath>
</defs>
`;

      // Add the SVG content to the tree
      const svgElement = treeElement.querySelector("svg");
      if (svgElement) {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");
        const defs = svgDoc.documentElement.querySelector("defs");
        if (defs) {
          svgElement.appendChild(defs);
        }
      }

      // Default avatar images based on gender
      const maleAvatar =
        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzM2NEY2QiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSI1MCIgZmlsbD0iIzFGMkEzNyIvPjxwYXRoIGQ9Ik01MCwxOTAgQzUwLDEyMCA5MCwxMTAgMTAwLDExMCBDMTEwLDExMCAxNTAsMTIwIDE1MCwxOTAiIGZpbGw9IiMxRjJBMzciLz48L3N2Zz4=";
      const femaleAvatar =
        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzgwMzQ2RCIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSI1MCIgZmlsbD0iIzRBMUY0MCIvPjxwYXRoIGQ9Ik01MCwxOTAgQzUwLDEyMCA5MCwxMTAgMTAwLDExMCBDMTEwLDExMCAxNTAsMTIwIDE1MCwxOTAiIGZpbGw9IiM0QTFGNDAiLz48L3N2Zz4=";

      // Update the node templates to be bigger, cleaner and more modern
      FamilyTree.templates.tommy.node = `
<g filter="url(#card-shadow)">
  <!-- Card background with rounded corners -->
  <rect x="0" y="0" height="120" width="280" rx="12" ry="12" fill="#1F2937" stroke="#374151" strokeWidth="1"/>
  
  <!-- Modern accent line at top of card -->
  <rect x="0" y="0" height="6" width="280" rx="12" ry="12" fill="#6366F1"/>
  
  <!-- Avatar placeholder - larger and positioned better -->
  <circle cx="45" cy="50" r="32" fill="#374151" stroke="#4B5563" strokeWidth="1"/>
  <image xlinkHref="${maleAvatar}" x="13" y="18" height="64" width="64" clipPath="url(#avatar-clip)"/>
</g>
`;

      FamilyTree.templates.tommy_female.node = `
<g filter="url(#card-shadow)">
  <!-- Card background with rounded corners -->
  <rect x="0" y="0" height="120" width="280" rx="12" ry="12" fill="#1F2937" stroke="#374151" strokeWidth="1"/>
  
  <!-- Modern accent line at top of card with female color -->
  <rect x="0" y="0" height="6" width="280" rx="12" ry="12" fill="#EC4899"/>
  
  <!-- Avatar placeholder - larger and positioned better -->
  <circle cx="45" cy="50" r="32" fill="#374151" stroke="#4B5563" strokeWidth="1"/>
  <image xlinkHref="${femaleAvatar}" x="13" y="18" height="64" width="64" clipPath="url(#avatar-clip)"/>
</g>
`;

      FamilyTree.templates.tommy_male.node = `
<g filter="url(#card-shadow)">
  <!-- Card background with rounded corners -->
  <rect x="0" y="0" height="120" width="280" rx="12" ry="12" fill="#1F2937" stroke="#374151" strokeWidth="1"/>
  
  <!-- Modern accent line at top of card with male color -->
  <rect x="0" y="0" height="6" width="280" rx="12" ry="12" fill="#3B82F6"/>
  
  <!-- Avatar placeholder - larger and positioned better -->
  <circle cx="45" cy="50" r="32" fill="#374151" stroke="#4B5563" strokeWidth="1"/>
  <image xlinkHref="${maleAvatar}" x="13" y="18" height="64" width="64" clipPath="url(#avatar-clip)"/>
</g>
`;

      // Update the text styling and positioning for the larger cards
      const nameStyle =
        'style="font-family: \'Inter\', system-ui, -apple-system, sans-serif; font-size: 16px; font-weight: 600; letter-spacing: -0.01em;" fill="#F3F4F6"';
      const roleStyle =
        'style="font-family: \'Inter\', system-ui, -apple-system, sans-serif; font-size: 14px; font-weight: 400;" fill="#D1D5DB"';
      const detailStyle =
        'style="font-family: \'Inter\', system-ui, -apple-system, sans-serif; font-size: 12px; font-weight: 400;" fill="#9CA3AF"';

      // Position text elements for the larger card
      FamilyTree.templates.tommy.field_0 = `<text class="bft-field-0" ${nameStyle} x="95" y="40">{val}</text>`;
      FamilyTree.templates.tommy.field_1 = `<text class="bft-field-1" ${roleStyle} x="95" y="65">{val}</text>`;
      FamilyTree.templates.tommy.field_2 = `<text class="bft-field-2" ${detailStyle} x="95" y="85">{val}</text>`;

      // Add birth/death dates as small text at bottom
      FamilyTree.templates.tommy.field_3 = `<text class="bft-field-3" ${detailStyle} x="95" y="105">Born: {val}</text>`;
      FamilyTree.templates.tommy.field_4 = `<text class="bft-field-4" ${detailStyle} x="190" y="105">Died: {val}</text>`;

      // Apply the same styling to male and female templates
      FamilyTree.templates.tommy_female.field_0 =
        FamilyTree.templates.tommy.field_0;
      FamilyTree.templates.tommy_female.field_1 =
        FamilyTree.templates.tommy.field_1;
      FamilyTree.templates.tommy_female.field_2 =
        FamilyTree.templates.tommy.field_2;
      FamilyTree.templates.tommy_female.field_3 =
        FamilyTree.templates.tommy.field_3;
      FamilyTree.templates.tommy_female.field_4 =
        FamilyTree.templates.tommy.field_4;

      FamilyTree.templates.tommy_male.field_0 =
        FamilyTree.templates.tommy.field_0;
      FamilyTree.templates.tommy_male.field_1 =
        FamilyTree.templates.tommy.field_1;
      FamilyTree.templates.tommy_male.field_2 =
        FamilyTree.templates.tommy.field_2;
      FamilyTree.templates.tommy_male.field_3 =
        FamilyTree.templates.tommy.field_3;
      FamilyTree.templates.tommy_male.field_4 =
        FamilyTree.templates.tommy.field_4;

      // Update the node menu button position for the larger card
      FamilyTree.templates.tommy.nodeCircleMenuButton =
        FamilyTree.templates.tommy_female.nodeCircleMenuButton =
        FamilyTree.templates.tommy_male.nodeCircleMenuButton =
          {
            radius: 24,
            x: 260,
            y: 100,
            color: "#1F2937",
            stroke: "#4B5563",
            strokeWidth: 2,
            hoverColor: "#374151",
            hoverStroke: "#6366F1",
          };

      // Update the family tree configuration to match the new node size and dark mode
      const family = new FamilyTree(treeElement, {
        mode: "dark", // Change to dark mode
        nodeBinding: props.nodeBinding,
        nodes: props.nodes,
        nodeCircleMenu: {
          PDFProfile: {
            icon: FamilyTree.icon.pdf(22, 22, "#D1D5DB"),
            text: "PDF Profile",
            color: "#1F2937",
          },
          editNode: {
            icon: FamilyTree.icon.edit(22, 22, "#D1D5DB"),
            text: "Edit Member",
            color: "#1F2937",
          },
          deleteNode: {
            icon: FamilyTree.icon.remove(22, 22, "#ef4444"),
            text: "Delete Member",
            color: "#1F2937",
          },
        },
        // Improved tree layout and spacing for the new node size
        levelSeparation: 100,
        siblingSeparation: 60,
        subtreeSeparation: 80,
        padding: 20,
        orientation: FamilyTree.orientation.top,
        layout: FamilyTree.mixed,
        scaleInitial: FamilyTree.match.boundary,
        enableSearch: true,
        enableDragDrop: true,
        enablePan: true,
        enableZoom: true,
        // Add smooth animations
        anim: { func: FamilyTree.anim.outBack, duration: 200 },
        // Change the connector lines to match the dark theme
        connectors: {
          type: "straight",
          style: {
            "stroke-width": "1",
            stroke: "#4B5563",
          },
        },
      });

      family.editUI.on("save", (sender, editedData) => {
        (async () => {
          try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("No authentication token found");

            const rawData = editedData.data || editedData;
            const resolvedId =
              rawData.id ||
              rawData._id ||
              rawData._state?.id ||
              rawData._state?._id;

            if (!resolvedId) {
              throw new Error("No valid ID found in edited data");
            }

            const updatedData = {
              name: rawData.name,
              gender: rawData.gender,
              status: rawData.status,
              birthDate: rawData.birthDate,
              deathDate: rawData.deathDate,
            };

            await updateFamilyMember(token, resolvedId, updatedData);
            await props.fetchData();
          } catch (error) {
            console.error("Error saving updated member:", error);
          }
        })();

        return true;
      });

      const canDeleteMember = (node: any) => {
        const hasPartner = node.pids && node.pids.length > 0;
        const hasChildren = props.nodes.some(
          (member: any) => member.fid === node.id || member.mid === node.id
        );
        const hasParents = node.fid || node.mid;

        // Case 1: Child without spouse/children
        if (hasParents && !hasPartner && !hasChildren) return true;

        // Case 2: Root couple with descendants
        if (hasChildren && hasPartner && !hasParents) return true;

        // Case 3: Root single parent with descendants
        if (hasChildren && !hasPartner && !hasParents) return true;

        // Case 4: Root couple without children
        if (!hasChildren && hasPartner && !hasParents) return true;

        return false;
      };

      family.nodeCircleMenuUI.on("show", (sender, args) => {
        var node = family.getNode(args.nodeId);
        delete args.menu.father;
        delete args.menu.mother;
        delete args.menu.wife;
        delete args.menu.husband;

        // Add parent options
        if (FamilyTree.isNEU(node.mid)) {
          args.menu.mother = {
            icon: FamilyTree.icon.mother(24, 24, "#ec4899"),
            text: "Add mother",
            color: "#1F2937",
            hoverColor: "#EC4899", // Added hover color
          };
        }

        if (FamilyTree.isNEU(node.fid)) {
          args.menu.father = {
            icon: FamilyTree.icon.father(24, 24, "#3b82f6"),
            text: "Add father",
            color: "#1F2937",
            hoverColor: "#3B82F6", // Added hover color
          };
        }

        // Check if node has a partner
        const hasPartner = node.pids && node.pids.length > 0;
        const partner = hasPartner ? family.getNode(node.pids[0]) : null;

        // Add children options
        if (hasPartner) {
          args.menu.addSon = {
            icon: FamilyTree.icon.son(24, 24, "#3b82f6"),
            text: `Add Son with partner`,
            color: "#1F2937",
            hoverColor: "#3B82F6",
          };
          args.menu.addDaughter = {
            icon: FamilyTree.icon.daughter(24, 24, "#ec4899"),
            text: `Add Daughter with partner`,
            color: "#1F2937",
            hoverColor: "#EC4899",
          };
        } else {
          args.menu.addSon = {
            icon: FamilyTree.icon.son(24, 24, "#3b82f6"),
            text: "Add Son",
            color: "#1F2937",
            hoverColor: "#3B82F6",
          };
          args.menu.addDaughter = {
            icon: FamilyTree.icon.daughter(24, 24, "#ec4899"),
            text: "Add Daughter",
            color: "#1F2937",
            hoverColor: "#EC4899",
          };
        }

        // Add partner option if no partner exists
        if (!hasPartner) {
          if (node.gender === "male") {
            args.menu.wife = {
              icon: FamilyTree.icon.wife(24, 24, "#ec4899"),
              text: "Add wife",
              color: "#1F2937",
              hoverColor: "#EC4899",
            };
          } else if (node.gender === "female") {
            args.menu.husband = {
              icon: FamilyTree.icon.husband(24, 24, "#3b82f6"),
              text: "Add husband",
              color: "#1F2937",
              hoverColor: "#3B82F6",
            };
          }
        }
      });

      family.nodeCircleMenuUI.on("click", async (sender, args) => {
        const node = family.getNode(args.nodeId);
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
          switch (args.menuItemName) {
            case "deleteNode": {
              if (!canDeleteMember(node)) {
                alert(
                  "Cannot delete this member as it would break the family tree structure."
                );
                return;
              }

              if (
                !confirm("Are you sure you want to delete this family member?")
              ) {
                return;
              }

              await deleteFamilyMember(token, node.id);
              await props.fetchData();
              break;
            }
            case "addSon":
            case "addDaughter": {
              const gender = args.menuItemName === "addSon" ? "male" : "female";
              const newMemberData = {
                name: "Unknown",
                gender: gender,
              };

              if (node.gender === "male") {
                newMemberData.fatherId = node.id;
                if (node.pids && node.pids[0]) {
                  newMemberData.motherId = node.pids[0];
                }
              } else {
                newMemberData.motherId = node.id;
                if (node.pids && node.pids[0]) {
                  newMemberData.fatherId = node.pids[0];
                }
              }

              await handleAddMember(
                token,
                node,
                gender === "male" ? "son" : "daughter",
                props.fetchData,
                newMemberData
              );
              break;
            }
            case "father":
              await handleAddMember(token, node, "father", props.fetchData);
              break;
            case "mother":
              await handleAddMember(token, node, "mother", props.fetchData);
              break;
            case "wife":
              await handleAddMember(token, node, "wife", props.fetchData);
              break;
            case "husband":
              await handleAddMember(token, node, "husband", props.fetchData);
              break;
            case "PDFProfile":
              family.exportPDFProfile({
                id: args.nodeId,
              });
              break;
            case "editNode":
              family.editUI.show(args.nodeId);
              break;
            default:
          }
        } catch (error) {
          console.error("Error handling member addition:", error);
        }
      });
    }
  }, [props.nodeBinding, props.nodes, props.fetchData]);

  return null;
}

// Update the TreeViewPage component to add more content and reduce whitespace
export default function TreeViewPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalMembers: 0,
    generations: 0,
    oldestMember: null,
    youngestMember: null,
  });

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch("http://localhost:3001/family-members", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      const members = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
        ? result.data
        : [];
      console.log("API raw result:", result);
      console.log("API members:", members);

      const processedData = members.map((member: any) => ({
        id: member._id,
        name: member.name,
        pids: Array.isArray(member.partnerId) ? member.partnerId : [],
        mid: member.motherId ? member.motherId.toString() : undefined,
        fid: member.fatherId ? member.fatherId.toString() : undefined,
        gender: member.gender,
        status: member.status,
        birthDate: member.birthDate,
        deathDate: member.deathDate,
      }));

      setData(processedData);

      // Calculate family statistics
      if (processedData.length > 0) {
        // Find the maximum generation depth
        const findGenerationDepth = (
          memberId: string,
          depth = 1,
          visited = new Set()
        ) => {
          if (visited.has(memberId)) return depth;
          visited.add(memberId);

          const member = processedData.find((m) => m.id === memberId);
          if (!member) return depth;

          const children = processedData.filter(
            (m) => m.fid === memberId || m.mid === memberId
          );
          if (children.length === 0) return depth;

          return Math.max(
            ...children.map((child) =>
              findGenerationDepth(child.id, depth + 1, new Set(visited))
            )
          );
        };

        // Find root members (those without parents)
        const rootMembers = processedData.filter((m) => !m.fid && !m.mid);
        const maxGeneration =
          rootMembers.length > 0
            ? Math.max(...rootMembers.map((m) => findGenerationDepth(m.id)))
            : 1;

        setStats({
          totalMembers: processedData.length,
          generations: maxGeneration,
          oldestMember: processedData.reduce((oldest, current) => {
            if (
              !oldest ||
              (oldest.birthDate &&
                current.birthDate &&
                new Date(current.birthDate) < new Date(oldest.birthDate))
            ) {
              return current;
            }
            return oldest;
          }, null),
          youngestMember: processedData.reduce((youngest, current) => {
            if (
              !youngest ||
              (youngest.birthDate &&
                current.birthDate &&
                new Date(current.birthDate) > new Date(youngest.birthDate))
            ) {
              return current;
            }
            return youngest;
          }, null),
        });
      }
    } catch (error) {
      console.error("Error fetching family tree data:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load family tree data"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();

    // Set up event listener for auth events to refresh tree data
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" && e.newValue) {
        // New login or registration detected, refresh data
        fetchData();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Check if we just logged in or registered
    const justLoggedIn = sessionStorage.getItem("justAuthenticated");
    if (justLoggedIn) {
      fetchData();
      sessionStorage.removeItem("justAuthenticated");
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const nodeBinding = {
    field_0: "name",
    field_1: "gender",
    field_2: "status",
    field_3: "birthDate",
    field_4: "deathDate",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#0B1120] text-gray-100"
    >
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex items-center">
          <button
            onClick={() => router.push("/dashboard/main")}
            className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Dashboard</span>
          </button>
        </div>

        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-semibold text-white mb-3">
            Family Tree Explorer
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Discover your roots, connect with your heritage, and visualize your
            family's journey through time.
          </p>
        </motion.div>

        {/* Stats Cards */}
        {!loading && !error && data.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <div className="rounded-xl bg-gray-800/50 p-6 backdrop-blur-sm border border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Family Members
              </h3>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-semibold text-white">{stats.totalMembers}</p>
                <span className="text-sm text-emerald-400">Active</span>
              </div>
            </div>
            <div className="rounded-xl bg-gray-800/50 p-6 backdrop-blur-sm border border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Generations
              </h3>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-semibold text-white">{stats.generations}</p>
                <span className="text-sm text-emerald-400">Depth</span>
              </div>
            </div>
            <div className="rounded-xl bg-gray-800/50 p-6 backdrop-blur-sm border border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Oldest Member
              </h3>
              <p className="text-xl font-semibold text-white truncate">
                {stats.oldestMember?.name || "N/A"}
              </p>
              <p className="text-sm text-gray-500">
                {stats.oldestMember?.birthDate || "Unknown"}
              </p>
            </div>
            <div className="rounded-xl bg-gray-800/50 p-6 backdrop-blur-sm border border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Youngest Member
              </h3>
              <p className="text-xl font-semibold text-white truncate">
                {stats.youngestMember?.name || "N/A"}
              </p>
              <p className="text-sm text-gray-500">
                {stats.youngestMember?.birthDate || "Unknown"}
              </p>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 overflow-hidden mb-8"
        >
          {/* Tree Header */}
          <div className="bg-gray-800/80 p-6 border-b border-gray-700/50 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">
              Interactive Family Tree
            </h2>
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm rounded-lg transition-colors duration-300 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Zoom In
              </button>
              <button className="px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm rounded-lg transition-colors duration-300 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                </svg>
                Zoom Out
              </button>
              <button className="px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm rounded-lg transition-colors duration-300 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
            </div>
          </div>

          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center items-center h-96"
            >
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-12 text-center"
            >
              <div className="text-red-400 mb-6 text-xl">⚠️ {error}</div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchData()}
                className="px-6 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-all duration-300"
              >
                Try Again
              </motion.button>
            </motion.div>
          ) : data.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 text-center"
            >
              <p className="text-gray-400 mb-6">
                Your family tree is empty. Start by adding your first family member.
              </p>
              <button className="px-6 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-all duration-300">
                Add First Member
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative"
            >
              <div className="p-4">
                <div id="tree" className="w-full h-[800px]"></div>
                <Familytree
                  nodes={data}
                  nodeBinding={nodeBinding}
                  fetchData={fetchData}
                />
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="rounded-xl bg-gray-800/50 p-6 backdrop-blur-sm border border-gray-700/50">
            <div className="text-emerald-400 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Navigation Tips
            </h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start">
                <span className="mr-2 text-emerald-400">•</span>
                <span>Click and drag to pan around the tree</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-emerald-400">•</span>
                <span>Use mouse wheel to zoom in and out</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-emerald-400">•</span>
                <span>Double-click a member to center the view</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl bg-gray-800/50 p-6 backdrop-blur-sm border border-gray-700/50">
            <div className="text-emerald-400 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Editing Members
            </h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start">
                <span className="mr-2 text-emerald-400">•</span>
                <span>Click on a member to see available actions</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-emerald-400">•</span>
                <span>Add parents, children, or partners</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-emerald-400">•</span>
                <span>Edit details like birth dates and status</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl bg-gray-800/50 p-6 backdrop-blur-sm border border-gray-700/50">
            <div className="text-emerald-400 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Sharing & Export
            </h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start">
                <span className="mr-2 text-emerald-400">•</span>
                <span>Export individual profiles as PDF</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-emerald-400">•</span>
                <span>Save the entire tree as an image</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-emerald-400">•</span>
                <span>Share your family history with relatives</span>
              </li>
            </ul>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center rounded-xl bg-gray-800/50 p-8 backdrop-blur-sm border border-gray-700/50"
        >
          <div className="max-w-3xl mx-auto">
            <p className="text-gray-300 text-lg mb-2">
              Click on a family member and use the circular menu to add, edit, or remove members.
            </p>
            <p className="text-sm text-emerald-400">
              Your family tree data is automatically saved as you make changes.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
