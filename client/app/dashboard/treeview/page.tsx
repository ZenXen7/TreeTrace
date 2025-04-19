"use client";

import { useEffect, useState } from "react";
import FamilyTree from "@balkangraph/familytree.js";
import { handleAddMember, updateFamilyMember, deleteFamilyMember } from "./service/familyService";

function Familytree(props: {
  nodeBinding: any;
  nodes: any;
  fetchData: () => Promise<void>;
}) {
  useEffect(() => {
    const treeElement = document.getElementById("tree");
    if (treeElement) {
      FamilyTree.templates.tommy.nodeCircleMenuButton =
        FamilyTree.templates.tommy_female.nodeCircleMenuButton =
        FamilyTree.templates.tommy_male.nodeCircleMenuButton =
          {
            radius: 20,
            x: 230,
            y: 60,
            color: "#fff",
            stroke: "#aeaeae",
          };

      const family = new FamilyTree(treeElement, {
        nodeTreeMenu: true,
        mode: "dark",
        nodeBinding: props.nodeBinding,
        nodes: props.nodes,
        nodeCircleMenu: {
          PDFProfile: {
            icon: FamilyTree.icon.pdf(30, 30, "#aeaeae"),
            text: "PDF Profile",
            color: "white",
          },
          editNode: {
            icon: FamilyTree.icon.edit(30, 30, "#aeaeae"),
            text: "Edit node",
            color: "white",
          },
          addClink: {
            icon: FamilyTree.icon.link(30, 30, "#aeaeae"),
            text: "Add C link",
            color: "#fff",
            draggable: true,
          },
          deleteNode: {
            icon: FamilyTree.icon.remove(30, 30, "#ff0000"),
            text: "Delete Member",
            color: "white",
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

      family.nodeCircleMenuUI.on("show", function (sender, args) {
        var node = family.getNode(args.nodeId);
        delete args.menu.father;
        delete args.menu.mother;
        delete args.menu.wife;
        delete args.menu.husband;

        // Add parent options
        if (FamilyTree.isNEU(node.mid)) {
          args.menu.mother = {
            icon: FamilyTree.icon.mother(30, 30, "#F57C00"),
            text: "Add mother",
            color: "white",
          };
        }

        if (FamilyTree.isNEU(node.fid)) {
          args.menu.father = {
            icon: FamilyTree.icon.father(30, 30, "#039BE5"),
            text: "Add father",
            color: "white",
          };
        }

        // Check if node has a partner
        const hasPartner = node.pids && node.pids.length > 0;
        const partner = hasPartner ? family.getNode(node.pids[0]) : null;

        // Add children options
        if (hasPartner) {
          args.menu.addSon = {
            icon: FamilyTree.icon.son(30, 30, "#039BE5"),
            text: `Add Son with partner`,
            color: "white",
          };
          args.menu.addDaughter = {
            icon: FamilyTree.icon.daughter(30, 30, "#F57C00"),
            text: `Add Daughter with partner`,
            color: "white",
          };
        } else {
          args.menu.addSon = {
            icon: FamilyTree.icon.son(30, 30, "#039BE5"),
            text: "Add Son",
            color: "white",
          };
          args.menu.addDaughter = {
            icon: FamilyTree.icon.daughter(30, 30, "#F57C00"),
            text: "Add Daughter",
            color: "white",
          };
        }

        // Add partner option if no partner exists
        if (!hasPartner) {
          if (node.gender === "male") {
            args.menu.wife = {
              icon: FamilyTree.icon.wife(30, 30, "#F57C00"),
              text: "Add wife",
              color: "white",
            };
          } else if (node.gender === "female") {
            args.menu.husband = {
              icon: FamilyTree.icon.husband(30, 30, "#F57C00"),
              text: "Add husband",
              color: "white",
            };
          }
        }
      });

      family.nodeCircleMenuUI.on("click", async function (sender, args) {
        let node = family.getNode(args.nodeId);
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

export default function TreeViewPage() {
  const [data, setData] = useState([]);

  async function fetchData() {
    try {
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
      const result = await response.json();
      const members = Array.isArray(result) ? result : result.data;

      setData(
        members.map((member: any) => ({
          id: member._id,
          name: member.name,
          pids: member.partnerId || [],
          mid: member.motherId,
          fid: member.fatherId,
          gender: member.gender,
          status: member.status,
          birthDate: member.birthDate,
          deathDate: member.deathDate,
        }))
      );
    } catch (error) {
      console.error("Error fetching family tree data:", error);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const nodeBinding = {
    field_0: "name",
    field_1: "gender",
    field_2: "status",
    field_3: "birthDate",
    field_4: "deathDate",
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Our Family Tree</h1>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div>
          <div id="tree"></div>
          <Familytree
            nodes={data}
            nodeBinding={nodeBinding}
            fetchData={fetchData}
          />
        </div>
      </div>
    </div>
  );
}
