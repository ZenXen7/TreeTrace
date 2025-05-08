"use client";

import { useEffect, useState } from "react"
import FamilyTree from "@balkangraph/familytree.js"
import { motion } from "framer-motion"
import { handleAddMember, updateFamilyMember, deleteFamilyMember, fetchFilteredFamilyMembers, getSurnameSimilaritiesCount } from "./service/familyService"
import { Filter, Share2 } from "lucide-react"
import useTreeStore from "@/store/useTreeStore"
import { toast } from "react-hot-toast"
import router from "next/router";
const maleAvatar =
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzM2NEY2QiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSI1MCIgZmlsbD0iIzFGMkEzNyIvPjxwYXRoIGQ9Ik01MCwxOTAgQzUwLDEyMCA5MCwxMTAgMTAwLDExMCBDMTEwLDExMCAxNTAsMTIwIDE1MCwxOTAiIGZpbGw9IiMxRjJBMzciLz48L3N2Zz4="
    const femaleAvatar =
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzgwMzQ2RCIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSI1MCIgZmlsbD0iIzRBMUY0MCIvPjxwYXRoIGQ9Ik01MCwxOTAgQzUwLDEyMCA5MCwxMTAgMTAwLDExMCBDMTEwLDExMCAxNTAsMTIwIDE1MCwxOTAiIGZpbGw9IiM0QTFGNDAiLz48L3N2Zz4="

// Move these to the top of the function or file, so they are only declared once
const nameStyle = 'style="font-family: \'Inter\', system-ui, -apple-system, sans-serif; font-size: 16px; font-weight: 600; letter-spacing: -0.01em;" fill="#F3F4F6"';
const roleStyle = 'style="font-family: \'Inter\', system-ui, -apple-system, sans-serif; font-size: 14px; font-weight: 400;" fill="#D1D5DB"';
const detailStyle = 'style="font-family: \'Inter\', system-ui, -apple-system, sans-serif; font-size: 12px; font-weight: 400;" fill="#9CA3AF"';

function Familytree(props: {
  nodeBinding: any;
  nodes: any;
  fetchData: () => Promise<void>;
}) {
  useEffect(() => {
    const treeElement = document.getElementById("tree");
    if (treeElement) {
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
`
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

      const img_0 ="https://preview.redd.it/some-random-black-dude-i-found-v0-7b7ipzz5af0c1.jpg?auto=webp&s=50dde31529bf146611d82a09c0e0e7cf3948a2d3"

      // Position text elements for the larger card
      FamilyTree.templates.tommy.field_0 = `<text class="bft-field-0" ${nameStyle} x="95" y="35">{val}</text>`
      FamilyTree.templates.tommy.field_1 = `<text class="bft-field-0" ${nameStyle} x="200" y="35">{val}</text>`
      FamilyTree.templates.tommy.field_2 = `<text class="bft-field-1" ${roleStyle} x="95" y="55">{val}</text>`
      FamilyTree.templates.tommy.field_3 = `<text class="bft-field-2" ${detailStyle} x="95" y="72">{val}</text>`
      FamilyTree.templates.tommy.field_6 = `<text class="bft-field-5" ${detailStyle} x="95" y="87">🌍 {val}</text>`
      FamilyTree.templates.tommy.field_7 = `<text class="bft-field-6" ${detailStyle} x="190" y="87">💼 {val}</text>`
      FamilyTree.templates.tommy.field_4 = `<text class="bft-field-3" ${detailStyle} x="95" y="105">Born: {val}</text>`
      FamilyTree.templates.tommy.field_5 = `<text class="bft-field-4" ${detailStyle} x="190" y="105">Died: {val}</text>`
      FamilyTree.templates.tommy.field_8 = `<text class="bft-field-7" ${detailStyle} x="270" y="120" text-anchor="end" transform="rotate(-45,270,120)">{val}</text>`
      // Add surname similarity badge - moved to bottom left
      FamilyTree.templates.tommy.field_9 = `
        <g transform="translate(20, 110)">
          <circle cx="0" cy="0" r="15" fill="#80cbc4" stroke="#4B5563" stroke-width="1"/>
          <text ${nameStyle} x="0" y="5" text-anchor="middle" fill="#F3F4F6" font-size="12px" font-weight="bold">{val}</text>
        </g>
      `

      // Make the node bigger to accommodate more fields
      FamilyTree.templates.tommy.node = `
<g filter="url(#card-shadow)">
  <!-- Card background with rounded corners -->
  <rect x="0" y="0" height="130" width="280" rx="12" ry="12" fill="#1F2937" stroke="#374151" strokeWidth="1"/>
  
  <!-- Modern accent line at top of card -->
  <rect x="0" y="0" height="6" width="280" rx="12" ry="12" fill="#80cbc4"/>
  
  <!-- Avatar placeholder - larger and positioned better -->
  <circle cx="45" cy="50" r="32" fill="#374151" stroke="#4B5563" strokeWidth="1"/>
  <image xlink:href="${img_0}" x="13" y="18" height="64" width="64" clip-path="url(#avatar-clip)" preserveAspectRatio="xMidYMid slice"/>
</g>
`
      FamilyTree.templates.tommy_female.node = `
<g filter="url(#card-shadow)">
  <!-- Card background with rounded corners -->
  <rect x="0" y="0" height="130" width="280" rx="12" ry="12" fill="#1F2937" stroke="#374151" strokeWidth="1"/>
  
  <!-- Modern accent line at top of card with female color -->
  <rect x="0" y="0" height="6" width="280" rx="12" ry="12" fill="#EC4899"/>
  
  <!-- Avatar placeholder - larger and positioned better -->
  <circle cx="45" cy="50" r="32" fill="#374151" stroke="#4B5563" strokeWidth="1"/>
  <image xlink:href="${img_0}" x="13" y="18" height="64" width="64" clip-path="url(#avatar-clip)" preserveAspectRatio="xMidYMid slice"/>
</g>
`;

      FamilyTree.templates.tommy_male.node = `
<g filter="url(#card-shadow)">
  <!-- Card background with rounded corners -->
  <rect x="0" y="0" height="130" width="280" rx="12" ry="12" fill="#1F2937" stroke="#374151" strokeWidth="1"/>
  
  <!-- Modern accent line at top of card with male color -->
  <rect x="0" y="0" height="6" width="280" rx="12" ry="12" fill="#3B82F6"/>
  
  <!-- Avatar placeholder - larger and positioned better -->
  <circle cx="45" cy="50" r="32" fill="#374151" stroke="#4B5563" strokeWidth="1"/>
  <image xlink:href="${img_0}" x="13" y="18" height="64" width="64" clip-path="url(#avatar-clip)" preserveAspectRatio="xMidYMid slice"/>
</g>
`;

      // Position text elements for the larger card
      FamilyTree.templates.tommy.field_0 = `<text class="bft-field-0" ${nameStyle} x="95" y="40">{val}</text>`;
      FamilyTree.templates.tommy.field_1 = `<text class="bft-field-1" ${roleStyle} x="95" y="65">{val}</text>`;
      FamilyTree.templates.tommy.field_2 = `<text class="bft-field-2" ${detailStyle} x="95" y="85">{val}</text>`;

      // Add birth/death dates as small text at bottom
      FamilyTree.templates.tommy.field_3 = `<text class="bft-field-3" ${detailStyle} x="95" y="105">Born: {val}</text>`;
      FamilyTree.templates.tommy.field_4 = `<text class="bft-field-4" ${detailStyle} x="190" y="105">Died: {val}</text>`;

      // Apply the same styling to male and female templates
      FamilyTree.templates.tommy_female.field_0 = FamilyTree.templates.tommy.field_0
      FamilyTree.templates.tommy_female.field_1 = FamilyTree.templates.tommy.field_1
      FamilyTree.templates.tommy_female.field_2 = FamilyTree.templates.tommy.field_2
      FamilyTree.templates.tommy_female.field_3 = FamilyTree.templates.tommy.field_3
      FamilyTree.templates.tommy_female.field_4 = FamilyTree.templates.tommy.field_4
      FamilyTree.templates.tommy_female.field_5 = FamilyTree.templates.tommy.field_5
      FamilyTree.templates.tommy_female.field_6 = FamilyTree.templates.tommy.field_6
      FamilyTree.templates.tommy_female.field_7 = FamilyTree.templates.tommy.field_7
      FamilyTree.templates.tommy_female.field_8 = FamilyTree.templates.tommy.field_8
      FamilyTree.templates.tommy_female.field_9 = FamilyTree.templates.tommy.field_9

      FamilyTree.templates.tommy_male.field_0 = FamilyTree.templates.tommy.field_0
      FamilyTree.templates.tommy_male.field_1 = FamilyTree.templates.tommy.field_1
      FamilyTree.templates.tommy_male.field_2 = FamilyTree.templates.tommy.field_2
      FamilyTree.templates.tommy_male.field_3 = FamilyTree.templates.tommy.field_3
      FamilyTree.templates.tommy_male.field_4 = FamilyTree.templates.tommy.field_4
      FamilyTree.templates.tommy_male.field_5 = FamilyTree.templates.tommy.field_5
      FamilyTree.templates.tommy_male.field_6 = FamilyTree.templates.tommy.field_6
      FamilyTree.templates.tommy_male.field_7 = FamilyTree.templates.tommy.field_7
      FamilyTree.templates.tommy_male.field_8 = FamilyTree.templates.tommy.field_8
      FamilyTree.templates.tommy_male.field_9 = FamilyTree.templates.tommy.field_9

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

        showXScroll: false,
        showYScroll: false,
        // miniMap: true,
        enableSearch: true,
        enableFilter: false,
        filterBy: [],
        
        // Update the editForm configuration to match the example
        editForm: {
          readOnly: false,
          titleBinding: "name",
          photoBinding: "imageUrl",
          generateElementsFromFields: false,
          elements: [
            [
              { type: 'textbox', label: 'Name', binding: 'name'},
              { type: 'textbox', label: 'Surname', binding: 'surname'},
            ],
            { type: 'select', options: [
                {value: 'alive', text: 'Alive'},
                {value: 'dead', text: 'Dead'},
                {value: 'unknown', text: 'Unknown'}
              ], 
              label: 'Status', binding: 'status' },
            [
              { type: 'date', label: 'Birth Date', binding: 'birthDate' },
              { type: 'date', label: 'Death Date', binding: 'deathDate' },
            ],
            [
              { type: 'select', options: [
                  {value: 'us', text: 'United States'},
                  {value: 'ph', text: 'Philippines'},
                  {value: 'ca', text: 'Canada'},
                  {value: 'uk', text: 'United Kingdom'},
                  {value: 'au', text: 'Australia'},
                  {value: 'jp', text: 'Japan'},
                  {value: 'sg', text: 'Singapore'},
                  {value: 'hk', text: 'Hong Kong'}
                ], 
                label: 'Country', binding: 'country' },
              { type: 'textbox', label: 'Occupation', binding: 'occupation' },
            ],
            { type: 'textbox', label: 'Photo URL', binding: 'imageUrl' },
          ]
        },

        // Improved tree layout and spacing for the new node size
        levelSeparation: 100,
        siblingSeparation: 60,
        subtreeSeparation: 80,
        padding: 20,
        orientation: FamilyTree.orientation.top,
        layout: FamilyTree.layout.normal,
        scaleInitial: FamilyTree.match.boundary,
        // enableSearch: true,
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

      // family.filterUI.on("show-items", (sender, args) => {
      //   if (args.name === 'gender') {
      //     args.value = "Filter by gender:";
      //     args.items = [
      //       { id: 'all', text: '[All]' },
      //       { id: 'male', text: 'Male' },
      //       { id: 'female', text: 'Female' }
      //     ];
      //   }
      //   else if (args.name === 'country') {
      //     args.value = "Filter by country:";
      //     args.items = [
      //       { id: 'all', text: '[All]' },
      //       { id: 'us', text: 'United States' },
      //       { id: 'ph', text: 'Philippines' },
      //       { id: 'ca', text: 'Canada' },
      //       { id: 'uk', text: 'United Kingdom' },
      //       { id: 'au', text: 'Australia' },
      //       { id: 'jp', text: 'Japan' },
      //       { id: 'sg', text: 'Singapore' },
      //       { id: 'hk', text: 'Hong Kong' }
      //     ];
      //   }
      //   else if (args.name === 'status') {
      //     args.value = "Filter by status:";
      //     args.items = [
      //       { id: 'all', text: '[All]' },
      //       { id: 'alive', text: 'Alive' },
      //       { id: 'deceased', text: 'Deceased' },
      //       { id: 'unknown', text: 'Unknown' }
      //     ];
      //   }
      // });

      // family.filterUI.on("add-filter", (sender, args) => {
      //   console.log("Filter added:", args);
      //
      //   if (args.name === "gender" && args.value !== "all") {
      //     family.filter((node) => {
      //       return node.gender === args.value;
      //     });
      //   }
      //   else if (args.name === "country" && args.value !== "all") {
      //     family.filter((node) => {
      //       return node.country === args.value;
      //     });
      //   }
      //   else if (args.name === "status" && args.value !== "all") {
      //     family.filter((node) => {
      //       return node.status === args.value;
      //     });
      //   }
      //   else {
      //     family.filter(() => true); // Show all if [All] selected
      //   }
      // });

      // family.filterUI.on("add-filter", (sender, args) => {
      //     console.log("Filter added:", args)
      //
      //     let filterName = args.name; // 'gender', 'country', or 'status'
      //     let filterValue = args.value; // selected value like 'male', 'us', etc.
      //
      //     family.nodes.forEach(node => {
      //         let showNode = true;
      //
      //         // Only apply filtering if filterValue is not 'all'
      //         if (filterValue !== 'all') {
      //             if (filterName === 'gender' && node.gender !== filterValue) {
      //                 showNode = false;
      //             } else if (filterName === 'country' && node.country !== filterValue) {
      //                 showNode = false;
      //             } else if (filterName === 'status' && node.status !== filterValue) {
      //                 showNode = false;
      //             }
      //         }
      //
      //         family.show(node.id, showNode);
      //     });
      // })

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

    
          let birthDate = rawData.birthDate ? new Date(rawData.birthDate) : null
          let deathDate = rawData.deathDate ? new Date(rawData.deathDate) : null
          
          // console.log("Edit form raw data:", rawData);
          // console.log("Country value:", rawData.country);
          // console.log("Occupation value:", rawData.occupation);
          
          const updatedData = {
            name: rawData.name,
            surname: rawData.surname,
            gender: rawData.gender,
            status: rawData.status,
            birthDate: birthDate,
            deathDate: deathDate,
            country: rawData.country,
            occupation: rawData.occupation,
            tags: rawData.tags,
            imageUrl: rawData.imageUrl
          }
          

          await updateFamilyMember(token, resolvedId, updatedData)
          await props.fetchData()
        } catch (error) {
          console.error("Error saving updated member:", error)
        }
      })()

      return true
    })
    const nodeBinding = props.nodeBinding

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



    // Update the node binding to include the new fields
    // nodeBinding = {
    //   field_0: "name",
    //   field_1: "gender",
    //   field_2: "status",
    //   field_3: "birthDate",
    //   field_4: "deathDate",
    //   field_5: "country",
    //   field_6: "occupation",
    //   field_7: "tags",
    //   // img_0: "imageUrl"
    // }

    family.nodeCircleMenuUI.on("show", (sender, args) => {
      var node = family.getNode(args.nodeId)
      delete args.menu.father
      delete args.menu.mother
      delete args.menu.wife
      delete args.menu.husband

        // Add parent options
        if (FamilyTree.isNEU(node.mid)) {
          args.menu.mother = {
            icon: FamilyTree.icon.mother(24, 24, "#ec4899"),
            text: "Add mother",
            color: "#1F2937",
          };
        }

        if (FamilyTree.isNEU(node.fid)) {
          args.menu.father = {
            icon: FamilyTree.icon.father(24, 24, "#3b82f6"),
            text: "Add father",
            color: "#1F2937",
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
          };
          args.menu.addDaughter = {
            icon: FamilyTree.icon.daughter(24, 24, "#ec4899"),
            text: `Add Daughter with partner`,
            color: "#1F2937",
          };
        } else {
          args.menu.addSon = {
            icon: FamilyTree.icon.son(24, 24, "#3b82f6"),
            text: "Add Son",
            color: "#1F2937",
          };
          args.menu.addDaughter = {
            icon: FamilyTree.icon.daughter(24, 24, "#ec4899"),
            text: "Add Daughter",
            color: "#1F2937",
          };
        }

        // Add partner option if no partner exists
        if (!hasPartner) {
          if (node.gender === "male") {
            args.menu.wife = {
              icon: FamilyTree.icon.wife(24, 24, "#ec4899"),
              text: "Add wife",
              color: "#1F2937",
            };
          } else if (node.gender === "female") {
            args.menu.husband = {
              icon: FamilyTree.icon.husband(24, 24, "#3b82f6"),
              text: "Add husband",
              color: "#1F2937",
            };
          }
        }
    });
    
    family.nodeCircleMenuUI.on("click", async (sender, args) => {
      const node = family.getNode(args.nodeId)
      const token = localStorage.getItem("token")
      if (!token) return

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

            await deleteFamilyMember(token, node.id)
            await props.fetchData()
            break
          }
          case "addSon":
          case "addDaughter": {
            const gender = args.menuItemName === "addSon" ? "male" : "female"
            const newMemberData = {
              name: "Unknown",
              surname: "Unknown",
              gender: gender,
            }

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
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilters, setActiveFilters] = useState({
    gender: 'all',
    country: 'all',
    status: 'all'
  })
  const [treeKey, setTreeKey] = useState(0) 
  const [stats, setStats] = useState({
    totalMembers: 0,
    generations: 0,
    oldestMember: null as any,
    youngestMember: null as any,
  })
  const { generatePublicLink } = useTreeStore()


  // Define a handler function for filter changes
  const handleFilterChange = (name: string, value: string) => {
    console.log(`Filter changed: ${name} = ${value}`);

    // Update the filter state and trigger re-fetch
    setActiveFilters((prev) => {
      const newFilters = {
        ...prev,
        [name]: value,
      };
      console.log("New filters:", newFilters);
      return newFilters;
    });

    // Show loading state immediately
    setLoading(true);
  };

  // Update the useEffect for filters to ensure they trigger properly
  useEffect(() => {
    console.log("Filter effect triggered with:", activeFilters);
    fetchData();
  }, [activeFilters]);

  // When data changes, increment treeKey to force Familytree remount
  useEffect(() => {
    setTreeKey((prev) => prev + 1);
  }, [data]);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("Fetching data with filters:", activeFilters);

      // Use the fetchFilteredFamilyMembers function from familyService
      try {
        const members = await fetchFilteredFamilyMembers(token, activeFilters);
        console.log("API returned members:", members);

        if (!members || members.length === 0) {
          setData([]);
          setStats({
            totalMembers: 0,
            generations: 0,
            oldestMember: null,
            youngestMember: null,
          });
          return;
        }

        // Strictly filter nodes on the frontend
        const strictFiltered = members.filter(
          (m: any) =>
            (activeFilters.gender === "all" ||
              m.gender === activeFilters.gender) &&
            (activeFilters.country === "all" ||
              m.country === activeFilters.country) &&
            (activeFilters.status === "all" ||
              m.status === activeFilters.status)
        );

        const allowedIds = new Set(
          strictFiltered.map(
            (m: any) => m._id?.toString?.() ?? m.id?.toString?.()
          )
        );

        // Fetch surname similarities for each member
        const processedDataPromises = strictFiltered.map(async (member:any) => {
          // Get similarity count for this member
          const similarityCount = await getSurnameSimilaritiesCount(token, member._id);
          
          // Format dates properly for display and edit form
          const formattedBirthDate = member.birthDate
            ? new Date(member.birthDate).toISOString().split("T")[0]
            : "";
          const formattedDeathDate = member.deathDate
            ? new Date(member.deathDate).toISOString().split("T")[0]
            : "";

          // Clean up references
          let pids = Array.isArray(member.partnerId) ? member.partnerId.filter((id:string) => allowedIds.has(id?.toString?.())) : [];
          let mid = member.motherId && allowedIds.has(member.motherId.toString()) ? member.motherId.toString() : undefined;
          let fid = member.fatherId && allowedIds.has(member.fatherId.toString()) ? member.fatherId.toString() : undefined;

          let imageUrl = member.imageUrl;
          if (!imageUrl || imageUrl.trim() === "") {
            imageUrl = member.gender === "female" ? femaleAvatar : maleAvatar;
          }

          return {
            id: member._id,
            name: member.name,
            surname: member.surname,
            pids,
            mid,
            fid,
            gender: member.gender,
            status: member.status || "alive",
            birthDate: formattedBirthDate,
            deathDate: formattedDeathDate,
            country: member.country || '',
            occupation: member.occupation || '',
            tags: Array.isArray(member.tags) ? member.tags.join(', ') : '',
            imageUrl,
            similarityCount: similarityCount > 0 ? similarityCount.toString() : '', // Add similarity count
          };
        });
        
        // Wait for all the similarity counts to be fetched
        const processedData = await Promise.all(processedDataPromises);

        setData(processedData);

        // Calculate family statistics
        if (processedData.length > 0) {
          // Find the maximum generation depth
          const findGenerationDepth = (memberId: string, depth = 1, visited = new Set<string>()): number => {
            if (visited.has(memberId)) return depth;
            visited.add(memberId);

            const member = processedData.find((m) => m.id === memberId);
            if (!member) return depth;

            const children = processedData.filter((m) => m.fid === memberId || m.mid === memberId);
            if (children.length === 0) return depth;

            return Math.max(...children.map((child) => findGenerationDepth(child.id, depth + 1, new Set(visited))));
          };

          // Find root members (those without parents)
          const rootMembers = processedData.filter((m) => !m.fid && !m.mid);
          const maxGeneration =
            rootMembers.length > 0 ? Math.max(...rootMembers.map((m) => findGenerationDepth(m.id))) : 1;

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
        console.error("Error fetching filtered family members:", error);
        throw error;
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

  // Add an effect that listens to activeFilters changes
  useEffect(() => {
    fetchData();
  }, [activeFilters]); // Re-fetch data when filters change

  // Keep the existing useEffect for initial data load
  useEffect(() => {
    // Check if we just logged in or registered
    const justLoggedIn = sessionStorage.getItem("justAuthenticated");
    if (justLoggedIn) {
      fetchData();
      sessionStorage.removeItem("justAuthenticated");
    }

    // Set up event listener for auth events to refresh tree data
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" && e.newValue) {
        // New login or registration detected, refresh data
        fetchData();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const nodeBinding = {
    field_0: "name",
    field_1: "surname",
    field_2: "gender",
    field_3: "status",
    field_4: "birthDate",
    field_5: "deathDate",
    field_6: "country",
    field_7: "occupation",
    field_8: "tags",
    field_9: "similarityCount", // Add similarity count binding
  }

  const handleShareTree = async () => {
    try {
      if (!data || data.length === 0) {
        toast.error("No family tree data available to share")
        return
      }
      const publicLink = generatePublicLink(data[0].id)
      await navigator.clipboard.writeText(publicLink)
      toast.success("Public link copied to clipboard!")
    } catch (error) {
      toast.error("Failed to copy link")
    }
  }

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
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
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
                <p className="text-3xl font-semibold text-white">
                  {stats.totalMembers}
                </p>
                <span className="text-sm text-emerald-400">Active</span>
              </div>
            </div>
            <div className="rounded-xl bg-gray-800/50 p-6 backdrop-blur-sm border border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Generations
              </h3>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-semibold text-white">
                  {stats.generations}
                </p>
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
          <div className="bg-gray-700 p-4 border-b border-gray-600">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Interactive Family Tree</h2>
              <div className="flex gap-2">
                <button 
                  className={`px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors ${
                    (activeFilters.gender === 'all' && activeFilters.country === 'all' && activeFilters.status === 'all') 
                      ? 'opacity-50 cursor-not-allowed' 
                      : ''
                  }`}
                  onClick={() => {
                    if (activeFilters.gender !== 'all' || activeFilters.country !== 'all' || activeFilters.status !== 'all') {
                      setActiveFilters({
                        gender: 'all',
                        country: 'all',
                        status: 'all'
                      });
                      setLoading(true);
                    }
                  }}
                  disabled={activeFilters.gender === 'all' && activeFilters.country === 'all' && activeFilters.status === 'all'}
                >
                  Reset Filters
                </button>
                <button 
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md transition-colors flex items-center gap-2"
                  onClick={handleShareTree}
                >
                  <Share2 className="h-4 w-4" />
                  Share Tree
                </button>
              </div>
            </div>
            
            {/* Filter controls - More prominent and aligned with mockup */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <Filter className="h-4 w-4 text-gray-400 mr-2" />
                <select 
                  className={`bg-gray-600 text-white text-sm rounded-md px-2 py-1 ${activeFilters.gender !== 'all' ? 'border-2 border-indigo-500' : ''}`}
                  value={activeFilters.gender}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                >
                  <option value="all">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <select 
                className={`bg-gray-600 text-white text-sm rounded-md px-2 py-1 ${activeFilters.country !== 'all' ? 'border-2 border-indigo-500' : ''}`}
                value={activeFilters.country}
                onChange={(e) => handleFilterChange('country', e.target.value)}
              >
                <option value="all">All Countries</option>
                <option value="us">United States</option>
                <option value="ph">Philippines</option>
                <option value="ca">Canada</option>
                <option value="uk">United Kingdom</option>
                <option value="au">Australia</option>
                <option value="jp">Japan</option>
                <option value="sg">Singapore</option>
                <option value="hk">Hong Kong</option>
              </select>

              <select 
                className={`bg-gray-600 text-white text-sm rounded-md px-2 py-1 ${activeFilters.status !== 'all' ? 'border-2 border-indigo-500' : ''}`}
                value={activeFilters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="alive">Alive</option>
                <option value="dead">Dead</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>
          
          {/* Active filters display - More compact and similar to mockup */}
          {(activeFilters.gender !== 'all' || activeFilters.country !== 'all' || activeFilters.status !== 'all') && (
            <div className="bg-gray-800 px-4 py-2 text-sm text-gray-300 border-b border-gray-700 flex items-center">
              <span className="mr-2">Active Filters:</span>
              {activeFilters.gender !== 'all' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 mr-2">
                  Gender: {activeFilters.gender}
                </span>
              )}
              {activeFilters.country !== 'all' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mr-2">
                  Country: {activeFilters.country}
                </span>
              )}
              {activeFilters.status !== 'all' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mr-2">
                  Status: {activeFilters.status}
                </span>
              )}
            </div>
          )}
          
          {/* Family Tree */}
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
              className="p-8 text-center"
            >
              {activeFilters.gender !== "all" ||
              activeFilters.country !== "all" ||
              activeFilters.status !== "all" ? (
                <div>
                  <p className="text-gray-400 mb-4">
                    No family members match your current filters.
                  </p>
                  <button
                    onClick={() => {
                      setActiveFilters({
                        gender: "all",
                        country: "all",
                        status: "all",
                      });
                      setLoading(true);
                    }}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all duration-300"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-400 mb-4">
                    Your family tree is empty. Start by adding your first family
                    member.
                  </p>
                  <button className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all duration-300">
                    Add First Member
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative"
            >
              <div className="p-4">
                <div id="tree" className="w-full h-[700px]"></div>
                <Familytree
                  key={treeKey}
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
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
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
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
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
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
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
              Click on a family member and use the circular menu to add, edit,
              or remove members.
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
