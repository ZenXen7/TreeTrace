"use client";

import { useEffect, useState } from "react";
import FamilyTree from "@balkangraph/familytree.js";
import { addFamilyMember, updateFamilyMember } from "./service/familyService";

function Familytree(props: {
  nodeBinding: any;
  nodes: any;
  fetchData: () => void;
}) {

  async function handleAddMember(node: any, relation: string) {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      let newMemberData: any = { name: "Unknown" };
      let updateCurrentNode: any = {};

      switch (relation) {
        case "father":
          newMemberData.gender = "male";
          newMemberData.partnerId = node.mid ? [node.mid] : [];
          const father = await addFamilyMember(token, newMemberData);
          updateCurrentNode.fatherId = father.id;
          break;

        case "mother":
          newMemberData.gender = "female";
          newMemberData.partnerId = node.fid ? [node.fid] : [];
          const mother = await addFamilyMember(token, newMemberData);
          updateCurrentNode.motherId = mother.id;
          break;

        case "wife":
          newMemberData.gender = "female";
          newMemberData.partnerId = [node.id];
          const wife = await addFamilyMember(token, newMemberData);
          updateCurrentNode.partnerId = [...(node.pids || []), wife.id];
          break;

        case "husband":
          newMemberData.gender = "male";
          newMemberData.partnerId = [node.id];
          const husband = await addFamilyMember(token, newMemberData);
          updateCurrentNode.partnerId = [...(node.pids || []), husband.id];
          break;

        default:
          return;
      }

      // Update the existing node to reflect the new relationship
      await updateFamilyMember(token, node.id, updateCurrentNode);

      await props.fetchData(); // Refresh the tree
    } catch (error) {
      console.error("Error adding family member:", error);
    }
  }

  useEffect(() => {
    const treeElement = document.getElementById("tree");
    if (treeElement) {
      FamilyTree.templates.tommy.nodeCircleMenuButton =
        FamilyTree.templates.tommy_female.nodeCircleMenuButton =
        FamilyTree.templates.tommy_male.nodeCircleMenuButton =
          {
            radius: 25,
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
        },
      });

      family.nodeCircleMenuUI.on("show", function (sender, args) {
        var node = family.getNode(args.nodeId);
        delete args.menu.father;
        delete args.menu.mother;
        delete args.menu.wife;
        delete args.menu.husband;

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

        if (node.gender == "male") {
          args.menu.wife = {
            icon: FamilyTree.icon.wife(30, 30, "#F57C00"),
            text: "Add wife",
            color: "white",
          };
        } else if (node.gender == "female") {
          args.menu.husband = {
            icon: FamilyTree.icon.husband(30, 30, "#F57C00"),
            text: "Add husband",
            color: "white",
          };
        } else {
          args.menu.wife = {
            icon: FamilyTree.icon.wife(30, 30, "#F57C00"),
            text: "Add wife",
            color: "white",
          };
          args.menu.husband = {
            icon: FamilyTree.icon.husband(30, 30, "#039BE5"),
            text: "Add husband",
            color: "white",
          };
        }
      });

      family.nodeCircleMenuUI.on("click", function (sender, args) {
        let node = family.getNode(args.nodeId);
        switch (args.menuItemName) {
          case "father":
            handleAddMember(node, "father");
            break;
          case "mother":
            handleAddMember(node, "mother");
            break;
          case "wife":
            handleAddMember(node, "wife");
            break;
          case "husband":
            handleAddMember(node, "husband");
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
