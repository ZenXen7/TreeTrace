"use client";

import { useEffect, useState } from "react";
import FamilyTree from "@balkangraph/familytree.js";
import { addFamilyMember } from "./service/familyService"; // Import the service function

function Familytree(props: {
  nodeBinding: any;
  nodes: any;
  fetchData: () => void;
}) {
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

      // Add show event to conditionally add menu items
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

      // Add click event handler
      family.nodeCircleMenuUI.on("click", function (sender, args) {
        let node = family.getNode(args.nodeId);
        switch (args.menuItemName) {
          case "husband":
            family.addPartnerNode({ gender: "male", pids: [args.nodeId] });
            break;
          case "wife":
            family.addPartnerNode({ gender: "female", pids: [args.nodeId] });
            break;
          case "mother":
            let motherData = { gender: "female" }; // Renamed variable
            if (!FamilyTree.isNEU(node.fid)) {
              motherData.pids = [node.fid];
            }
            family.addParentNode(args.nodeId, "mid", motherData);
            break;
          case "father":
            let fatherData = { gender: "male" }; // Renamed variable
            if (!FamilyTree.isNEU(node.mid)) {
              fatherData.pids = [node.mid];
            }
            family.addParentNode(args.nodeId, "fid", fatherData);
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

      family.nodeCircleMenuUI.on("drop", function (sender, args) {
        family.addClink(args.from, args.to).draw(FamilyTree.action.update);
      });

      family.nodeCircleMenuUI.on("mouseenter", function (sender, args) {
        if (args.menuItem.text == "Remove node") {
          var node = document.querySelector('[data-n-id="' + args.from + '"]');
          node.style.opacity = 0.5;
        }
      });

      // Add mouseout event handler
      family.nodeCircleMenuUI.on("mouseout", function (sender, args) {
        var node = document.querySelector('[data-n-id="' + args.from + '"]');
        node.style.opacity = 1;
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
