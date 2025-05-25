"use client"

import { useEffect, useState, useRef } from "react"
import FamilyTree from "@balkangraph/familytree.js"
import { motion } from "framer-motion"
import {
  handleAddMember,
  updateFamilyMember,
  deleteFamilyMember,
  fetchFilteredFamilyMembers,
  getMemberSuggestionCount,
} from "./service/familyService"
import {
  Filter,
  Share2,
  Users,
  TreePine,
  Heart,
  Search,
  BarChart3,
  Settings,
  Info,
  Edit,
  Navigation,
  Sparkles,
} from "lucide-react"
import useTreeStore from "@/store/useTreeStore"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"
import AnimatedNodes from "@/components/animated-nodes"
import "./tree.css" // Import FamilyTreeJS styling fixes
import Link from "next/link"
import AIChatSidebar from "@/components/AIChatSidebar"
import AIChatToggle from "@/components/AIChatToggle"

const maleAvatar =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzM2NEY2QiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSI1MCIgZmlsbD0iIzFGMkEzNyIvPjxwYXRoIGQ9Ik01MCwxOTAgQzUwLDEyMCA5MCwxMTAgMTAwLDExMCBDMTEwLDExMCAxNTAsMTIwIDE1MCwxOTAiIGZpbGw9IiMxRjJBMzciLz48L3N2Zz4="
const femaleAvatar =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzgwMzQ2RCIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSI1MCIgZmlsbD0iIzRBMUY0MCIvPjxwYXRoIGQ9Ik01MCwxOTAgQzUwLDEyMCA5MCwxMTAgMTAwLDExMCBDMTEwLDExMCAxNTAsMTIwIDE1MCwxOTAiIGZpbGw9IiM0QTFGNDAiLz48L3N2Zz4="

// Move these to the top of the function or file, so they are only declared once
const nameStyle =
  'style="font-family: \'Inter\', system-ui, -apple-system, sans-serif; font-size: 16px; font-weight: 600; letter-spacing: -0.01em;" fill="#F3F4F6"'
const roleStyle =
  'style="font-family: \'Inter\', system-ui, -apple-system, sans-serif; font-size: 14px; font-weight: 400;" fill="#D1D5DB"'
const detailStyle =
  'style="font-family: \'Inter\', system-ui, -apple-system, sans-serif; font-size: 12px; font-weight: 400;" fill="#9CA3AF"'

function Familytree(props: {
  nodeBinding: any
  nodes: any
  fetchData: () => Promise<void>
}) {
  const treeContainer = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const treeElement = document.getElementById("tree")
    if (treeElement) {
      const svgContent = `
<defs>
  <!-- Filter for card shadow -->
  <filter id="card-shadow" x="-10%" y="-10%" width="120%" height="120%">
    <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.4" floodColor="#000"/>
  </filter>
</defs>
`
      // Add the SVG content to the tree
      const svgElement = treeElement.querySelector("svg")
      if (svgElement) {
        const parser = new DOMParser()
        const svgDoc = parser.parseFromString(svgContent, "image/svg+xml")
        const defs = svgDoc.documentElement.querySelector("defs")
        if (defs) {
          svgElement.appendChild(defs)
        }
      }

      const img_0 =
        "https://preview.redd.it/some-random-black-dude-i-found-v0-7b7ipzz5af0c1.jpg?auto=webp&s=50dde31529bf146611d82a09c0e0e7cf3948a2d3"

      FamilyTree.templates.tommy.field_0 = `<text class="bft-field-0" ${nameStyle} x="25" y="60">{val}</text>` // First name
      FamilyTree.templates.tommy.field_1 = `<text class="bft-field-1" ${nameStyle} x="25" y="85">{val}</text>` // Surname
      FamilyTree.templates.tommy.field_4 = `<text class="bft-field-4" ${detailStyle} x="25" y="110">Birth: {val}</text>` // Birth date

      FamilyTree.templates.tommy.field_2 = ``
      FamilyTree.templates.tommy.field_3 = ``
      FamilyTree.templates.tommy.field_5 = ``
      FamilyTree.templates.tommy.field_6 = ``
      FamilyTree.templates.tommy.field_7 = ``
      FamilyTree.templates.tommy.field_8 = ``
      FamilyTree.templates.tommy.field_9 = `
        <g class="suggestion-badge-svg" data-suggestion-badge="true" transform="translate(20, 20)" style="cursor:pointer;">
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feFlood floodColor="#FFA500" floodOpacity="0.3" result="color"/>
            <feComposite in="color" in2="blur" operator="in" result="glow"/>
            <feMerge>
              <feMergeNode in="glow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <circle cx="0" cy="0" r="18" fill="#F97316" stroke="#FFFFFF" strokeWidth="3" filter="url(#glow)"></circle>
          <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fontSize="16px" fontWeight="bold" fill="white">{val}</text>
          <circle cx="0" cy="0" r="18" fill="none" stroke="#F97316" strokeWidth="2" opacity="0.5" class="pulse-circle">
            <animate attributeName="r" from="18" to="28" dur="1.5s" begin="0s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" begin="0s" repeatCount="indefinite"/>
          </circle>
        </g>
      `

      // Copy the suggestion badge to other templates
      FamilyTree.templates.tommy_female.field_9 = FamilyTree.templates.tommy.field_9
      FamilyTree.templates.tommy_male.field_9 = FamilyTree.templates.tommy.field_9

      // Adjust node sizes for a cleaner look with fewer fields
      FamilyTree.templates.tommy.node = `
<g filter="url(#card-shadow)">
  <!-- Card background with rounded corners -->
  <rect x="0" y="0" height="140" width="250" rx="15" ry="15" fill="#1F2937" stroke="#374151" strokeWidth="1.5"/>
  
  <!-- Neutral accent -->
  <rect x="0" y="0" height="10" width="250" rx="10" ry="0" fill="#80cbc4"/>
  
  <!-- Small icon placeholder for gender icon at top right -->
  <circle cx="225" cy="30" r="15" fill="#374151" stroke="#4B5563" strokeWidth="1.5"/>
</g>
`
      FamilyTree.templates.tommy_female.node = `
<g filter="url(#card-shadow)">
  <!-- Card background with rounded corners -->
  <rect x="0" y="0" height="140" width="250" rx="15" ry="15" fill="#1F2937" stroke="#374151" strokeWidth="1.5"/>
  
  <!-- Female accent -->
  <rect x="0" y="0" height="10" width="250" rx="10" ry="0" fill="#EC4899"/>
  
  <!-- Female icon placeholder at top right -->
  <circle cx="225" cy="30" r="15" fill="#EC4899" stroke="#4B5563" strokeWidth="1.5"/>
  <!-- Female icon image -->
  <image href="https://cdn-icons-png.flaticon.com/128/1019/1019071.png" x="210" y="15" height="30" width="30" preserveAspectRatio="xMidYMid meet"/>
</g>
`

      FamilyTree.templates.tommy_male.node = `
<g filter="url(#card-shadow)">
  <!-- Card background with rounded corners -->
  <rect x="0" y="0" height="140" width="250" rx="15" ry="15" fill="#1F2937" stroke="#374151" strokeWidth="1.5"/>
  
  <!-- Male accent -->
  <rect x="0" y="0" height="10" width="250" rx="10" ry="0" fill="#3B82F6"/>
  
  <!-- Male icon placeholder at top right -->
  <circle cx="225" cy="30" r="15" fill="#3B82F6" stroke="#4B5563" strokeWidth="1.5"/>
  <!-- Male icon image -->
  <image href="https://cdn-icons-png.flaticon.com/128/1019/1019070.png" x="212" y="17" height="26" width="26" preserveAspectRatio="xMidYMid meet"/>
</g>
`

      // Update the node menu button position for the cards
      FamilyTree.templates.tommy.nodeCircleMenuButton =
        FamilyTree.templates.tommy_female.nodeCircleMenuButton =
        FamilyTree.templates.tommy_male.nodeCircleMenuButton =
          {
            radius: 18,
            x: 220,
            y: 100,
            color: "#1F2937",
            stroke: "#4B5563",
            strokeWidth: 2,
            hoverColor: "#374151",
            hoverStroke: "#00CCAA",
          }

      // Add a style element to hide the avatar in edit forms
      const styleElement = document.createElement("style")
      styleElement.textContent = `
        .bft-edit-form-avatar, #bft-avatar, div[id="bft-avatar"] {
          display: none !important;
        }
        .bft-edit-form-title {
          margin-top: 20px !important;
        }
        
        /* Female edit form styles - more specific selectors to ensure they apply */
        .bft-edit-form.female-edit-form {
          border: 2px solid rgba(236, 72, 153, 0.5) !important;
        }
        .bft-edit-form.female-edit-form .bft-form-header,
        .bft-edit-form.female-edit-form .bft-edit-form-header {
          background-color: rgba(236, 72, 153, 0.15) !important;
          border-bottom: 1px solid rgba(236, 72, 153, 0.3) !important;
        }
        .bft-edit-form.female-edit-form .bft-edit-form-title,
        .bft-edit-form.female-edit-form .bft-form-title {
          color: rgb(236, 72, 153) !important;
        }
        .bft-edit-form.female-edit-form button.bft-form-btn,
        .bft-edit-form.female-edit-form .bft-submit {
          background-color: rgb(236, 72, 153) !important;
          border-color: rgb(216, 52, 133) !important;
        }
        .bft-edit-form.female-edit-form button.bft-form-btn:hover,
        .bft-edit-form.female-edit-form .bft-submit:hover {
          background-color: rgb(216, 52, 133) !important;
        }
      `
      document.head.appendChild(styleElement)

      // Add a script to replace any "Unknown" text in the header with the person's name
      // Only add the script if it doesn't already exist
      if (!document.getElementById("tree-trace-form-fixer")) {
        const script = document.createElement("script")
        script.id = "tree-trace-form-fixer"
        script.textContent = `
          // Check if we've already initialized
          if (!window.treeTraceFixerInitialized) {
            window.treeTraceFixerInitialized = true;
            
            // Function to fix the edit form title
            function fixEditFormTitle() {
              // Find all forms
              const forms = document.querySelectorAll('.bft-edit-form');
              forms.forEach(form => {
                // Get the title element
                const titleElement = form.querySelector('.bft-edit-form-title');
                if (titleElement && titleElement.textContent === 'Unknown') {
                  // Find the node ID
                  const nodeId = form.getAttribute('data-bft-node-id');
                  if (nodeId) {
                    // Find name and surname inputs
                    const nameInput = form.querySelector('input[data-binding="name"]');
                    const surnameInput = form.querySelector('input[data-binding="surname"]');
                    
                    // Create a full name from the inputs
                    let fullName = '';
                    if (nameInput && nameInput.value) {
                      fullName += nameInput.value;
                    }
                    if (surnameInput && surnameInput.value) {
                      if (fullName) fullName += ' ';
                      fullName += surnameInput.value;
                    }
                    
                    // Update the title if we have a name
                    if (fullName) {
                      titleElement.textContent = fullName;
                    }
                  }
                }
              });
            }
            
            // Watch for edit forms being added to the DOM
            const observer = new MutationObserver(mutations => {
              mutations.forEach(mutation => {
                if (mutation.addedNodes.length) {
                  // Look for edit forms among the added nodes
                  mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // ELEMENT_NODE
                      const element = node;
                      if (element.classList && element.classList.contains('bft-edit-form')) {
                        // Fix the title immediately
                        setTimeout(fixEditFormTitle, 100);
                      }
                      // Also check if added node contains edit forms
                      const forms = element.querySelectorAll ? element.querySelectorAll('.bft-edit-form') : [];
                      if (forms.length) {
                        setTimeout(fixEditFormTitle, 100);
                      }
                    }
                  });
                }
              });
            });
            
            // Start observing the body for edit forms
            observer.observe(document.body, { 
              childList: true, 
              subtree: true 
            });
            
            console.log('Tree-Trace form fixer initialized');
          }
        `
        document.head.appendChild(script)
      }

      // Apply the same field styling to male and female templates
      for (let i = 0; i <= 9; i++) {
        FamilyTree.templates.tommy_female[`field_${i}`] = FamilyTree.templates.tommy[`field_${i}`]
        FamilyTree.templates.tommy_male[`field_${i}`] = FamilyTree.templates.tommy[`field_${i}`]
      }

      // Update the family tree configuration to match the new node size and dark mode
      const family = new FamilyTree(treeElement, {
        mode: "dark", // Change to dark mode
        nodeBinding: props.nodeBinding,
        nodes: props.nodes,
        nodeCircleMenu: {
          medicalHistory: {
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 7H15M7 11H17M9 15H15M8.8 3H15.2C16.8802 3 17.7202 3 18.362 3.32698C18.9265 3.6146 19.3854 4.07354 19.673 4.63803C20 5.27976 20 6.11984 20 7.8V16.2C20 17.8802 20 18.7202 19.673 19.362C19.3854 19.9265 18.9265 20.3854 18.362 20.673C17.7202 21 16.8802 21 15.2 21H8.8C7.11984 21 6.27976 21 5.63803 20.673C5.07354 20.3854 4.6146 19.9265 4.32698 19.362C4 18.7202 4 17.8802 4 16.2V7.8C4 6.11984 4 5.27976 4.32698 4.63803C4.6146 4.07354 5.07354 3.6146 5.63803 3.32698C6.27976 3 7.11984 3 8.8 3Z" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>`,
            text: "Medical History",
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
        searchFields: ["name", "surname"], // Only search in name and surname fields
        searchDisplayField: "name", // Display name in search results
        searchFieldsWeight: {
          name: 100,
          surname: 80,
        }, // Give higher priority to exact name matches

        // Custom search method for more precise full name matching
        searchMethod: (query, data, searchFields, searchFieldsWeight) => {
          // Convert search query to lowercase for case-insensitive matching
          const searchQuery = query.toLowerCase()
          const results = []

          // First try exact full name match (name + surname)
          for (let i = 0; i < data.length; i++) {
            const node = data[i]
            // Create a full name from name and surname fields
            const fullName = `${node.name || ""} ${node.surname || ""}`.toLowerCase().trim()

            // If we have an exact full name match, only return this result
            if (fullName === searchQuery) {
              return [node]
            }

            // Check if full name contains the search query
            if (fullName.includes(searchQuery)) {
              results.push(node)
            }
            // Also check individual fields
            else if (
              (node.name && node.name.toLowerCase().includes(searchQuery)) ||
              (node.surname && node.surname.toLowerCase().includes(searchQuery))
            ) {
              results.push(node)
            }
          }

          return results
        },

        filterBy: [],

        // Update the editForm configuration to match the example
        editForm: {
          readOnly: false,
          titleBinding: "name",
          photoBinding: "",
          generateElementsFromFields: false,
          elements: [
            [
              { type: "textbox", label: "Name", binding: "name" },
              { type: "textbox", label: "Surname", binding: "surname" },
            ],
            {
              type: "select",
              options: [
                { value: "alive", text: "Alive" },
                { value: "dead", text: "Dead" },
                { value: "unknown", text: "Unknown" },
              ],
              label: "Status",
              binding: "status",
            },
            [
              { type: "date", label: "Birth Date", binding: "birthDate" },
              { type: "date", label: "Death Date", binding: "deathDate" },
            ],
            [
              {
                type: "select",
                options: [
                  { value: "Philippines", text: "Philippines" },
                  { value: "United States", text: "United States" },
                  { value: "Canada", text: "Canada" },
                  { value: "United Kingdom", text: "United Kingdom" },
                  { value: "Australia", text: "Australia" },
                  { value: "Japan", text: "Japan" },
                  { value: "Singapore", text: "Singapore" },
                  { value: "Hong Kong", text: "Hong Kong" },
                ],
                label: "Country",
                binding: "country",
              },
              { type: "textbox", label: "Occupation", binding: "occupation" },
            ],
          ],
          buttons: {
            edit: {
              text: "Update",
            },
            share: {
              text: "Share",
            },
            pdf: {
              text: "Export PDF",
            },
          },
        },

        // Optimized spacing and layout for improved node design
        levelSeparation: 160,
        siblingSeparation: 90,
        subtreeSeparation: 120,
        padding: 50,
        orientation: FamilyTree.orientation.top,
        layout: FamilyTree.layout.normal,
        // scaleInitial: FamilyTree.match.boundary,
        // enableSearch: true,
        enableDragDrop: true,
        enablePan: true,
        enableZoom: true,
        // Smoother and slightly slower animations for better visual experience
        anim: { func: FamilyTree.anim.outBack, duration: 300 },
        // Improved connectors with better styling
        connectors: {
          type: "curved",
          style: {
            "stroke-width": "1.5",
            stroke: "#6B7280",
            "stroke-dasharray": "none",
            "stroke-opacity": "0.8",
          },
        },
      })

      // Cast the family object to any to avoid TypeScript errors
      const familyAny = family as any

      // Add event listener for tree initialization
      familyAny.on("init", () => {
        console.log("Tree initialized")
      })

      // Add event listener to remove the avatar from edit forms
      familyAny.editUI.on("show", (sender, args) => {
        setTimeout(() => {
          // Hide avatar elements in the edit form
          const avatarElement = document.querySelector(".bft-edit-form-avatar")
          if (avatarElement) {
            ;(avatarElement as HTMLElement).style.display = "none"
          }

          const bftAvatar = document.getElementById("bft-avatar")
          if (bftAvatar) {
            bftAvatar.style.display = "none"
          }

          // Update the title with the person's name and surname
          const titleElement = document.querySelector(".bft-edit-form-title")
          if (titleElement) {
            // Get the node data for the person being edited
            const nodeId = args.nodeId
            const nodeData = family.get(nodeId)
            if (nodeData) {
              // Cast to any to access the name and surname properties
              const node = nodeData as any
              // Create a display name from name and surname
              const displayName = `${node.name || ""} ${node.surname || ""}`.trim()
              if (displayName) {
                titleElement.textContent = displayName
              }

              // Apply female styling if the node is female
              const editForm = document.querySelector(".bft-edit-form")
              if (editForm && node.gender === "female") {
                editForm.classList.add("female-edit-form")

                // Force refresh styles
                setTimeout(() => {
                  const submitButtons = editForm.querySelectorAll("button")
                  submitButtons.forEach((button) => {
                    if (button.textContent === "Update" || button.textContent === "Save") {
                      button.style.backgroundColor = "rgb(236, 72, 153)"
                      button.style.borderColor = "rgb(216, 52, 133)"
                    }
                  })
                }, 10)
              }
            }
            ;(titleElement as HTMLElement).style.marginTop = "20px"
          }
        }, 100)
      })

      // Enhance the redraw event handler to ensure proper IDs are used
      familyAny.on("redraw", (sender: any) => {
        // Removed performance-impacting log

        try {
          // Get all nodes without parameters as per Balkan's API
          const nodes = (family as any).get()

          if (!nodes || !Array.isArray(nodes)) {
            // Removed performance-impacting log
            return
          }

          // Get all nodes that have suggestions
          const nodesWithSuggestions = nodes.filter(
            (node: any) =>
              (node.actualSuggestionCount && node.actualSuggestionCount > 0) ||
              (node.hasSimilarityMatch === true &&
                (node.suggestionCount === undefined || Number.parseInt(node.suggestionCount) > 0)) ||
              (node.tags && node.tags.includes("suggestion")),
          )

          // Removed performance-impacting log

          // Process each node with suggestions to add our custom badge
          setTimeout(() => {
            nodesWithSuggestions.forEach((node: any) => {
              try {
                // Find the node's DOM element
                const nodeElement = document.querySelector(`[data-n-id="${node.id}"]`)
                if (!nodeElement) {
                  // Removed performance-impacting log
                  return
                }

                // Check if we already added a suggestion badge to this node
                const existingBadge = nodeElement.querySelector(".custom-suggestion-badge")
                if (existingBadge) {
                  // Removed performance-impacting log
                  return
                }

                // Make sure we have a valid ID - not a template string
                const nodeId = String(node.id)
                // Removed performance-impacting log

                // Create a larger, more prominent badge as a link
                const badgeLink = document.createElement("a")
                badgeLink.className = "custom-suggestion-badge"
                badgeLink.href = `/dashboard/suggestions/${nodeId}`

                // Make the badge more prominent
                badgeLink.style.cssText = `
                  position: absolute;
                  top: -12px;
                  left: -12px;
                  width: 36px;
                  height: 36px;
                  background-color: #F97316;
                  border-radius: 50%;
                  border: 3px solid white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-size: 18px;
                  font-weight: bold;
                  cursor: pointer;
                  z-index: 9999;
                  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                  text-decoration: none;
                  animation: pulse-badge 1.5s infinite;
                `

                // Add a pulsing effect with CSS animation
                const style = document.createElement("style")
                style.textContent = `
                  @keyframes pulse-badge {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                  }
                `
                document.head.appendChild(style)

                // Show the suggestion count - THIS is where we need accuracy
                // Get the actual count from an API call if possible, or use the value directly
                const actualCount =
                  node.actualSuggestionCount !== undefined
                    ? node.actualSuggestionCount
                    : node.suggestionCount && node.suggestionCount !== ""
                      ? Number.parseInt(node.suggestionCount)
                      : 0

                // Only add the badge if there are actually suggestions to show
                if (actualCount <= 0) {
                  // Removed performance-impacting log
                  return // Skip adding badge for nodes with 0 suggestions
                }

                badgeLink.textContent = actualCount.toString()

                // Add a click event just to ensure it works even if href doesn't
                badgeLink.addEventListener("click", (e) => {
                  // Redundant but ensures it works
                  window.location.href = `/dashboard/suggestions/${nodeId}`
                })

                // Add badge to the node element
                ;(nodeElement as HTMLElement).style.position = "relative"
                nodeElement.appendChild(badgeLink)

                // Removed performance-impacting log
              } catch (error) {
                console.error(`Error adding badge to node ${node.id}:`, error)
              }
            })
          }, 200)
        } catch (error) {
          console.error("Error processing suggestions badges:", error)
        }
      })

      // Add event listener for tree render completion
      familyAny.on("render", () => {
        // Removed performance-impacting log

        // Use setTimeout to ensure all elements are fully rendered
        setTimeout(() => {
          // Get all suggestion badges by class
          const badges = document.querySelectorAll(".suggestion-badge-svg")
          // Removed performance-impacting log

          badges.forEach((badge) => {
            // Find the parent node element that contains this badge
            const nodeElement = badge.closest("[data-n-id]")
            if (!nodeElement) return

            // Get the actual node ID from the parent element
            const nodeId = nodeElement.getAttribute("data-n-id")
            if (!nodeId) return

            // Removed performance-impacting log

            // Remove previous event listeners by cloning the element
            const newBadge = badge.cloneNode(true)
            if (badge.parentNode) {
              badge.parentNode.replaceChild(newBadge, badge)
            }

            // Make the badge clickable
            newBadge.style.cursor = "pointer"

            // Add click event listener to the new badge
            newBadge.addEventListener("click", (e) => {
              e.stopPropagation()
              e.preventDefault()
              // Navigate directly to the suggestions page with the real ID
              window.location.href = `/dashboard/suggestions/${nodeId}`
            })
          })
        }, 500)
      })

      // Add event listener for node click instead of relying on template placeholders
      familyAny.on("click", (sender, args) => {
        // If a family member is clicked directly (not a suggestion badge), normal behavior applies
        if (!args.event || !args.event.target) {
          return true // Allow default behavior if no event target
        }

        // Check if a badge was clicked
        const badgeElement =
          args.event.target.closest('[data-suggestion-badge="true"]') ||
          args.event.target.closest(".suggestion-badge-svg") ||
          args.event.target.closest(".custom-suggestion-badge")

        if (!badgeElement) {
          return true // Allow default behavior for non-badge clicks
        }

        // If we're here, a suggestion badge was clicked
        // Prevent the default node click behavior
        args.preventDefault()

        // Get the actual node data from the args
        const nodeId = args.node.id
        console.log("Suggestion badge clicked via FamilyTree click event for node ID:", nodeId)

        // Navigate to the suggestions page with the real ID (ensure it's a string)
        const realNodeId = String(nodeId).replace(/{.*}/, "")
        window.location.href = `/dashboard/suggestions/${realNodeId}`

        // Prevent default behavior
        return false
      })

      familyAny.editUI.on("save", (sender, editedData) => {
        ;(async () => {
          try {
            const token = localStorage.getItem("token")
            if (!token) throw new Error("No authentication token found")

            const rawData = editedData.data || editedData
            const resolvedId = rawData.id || rawData._id || rawData._state?.id || rawData._state?._id

            if (!resolvedId) {
              throw new Error("No valid ID found in edited data")
            }

            const birthDate = rawData.birthDate ? new Date(rawData.birthDate) : null
            const deathDate = rawData.deathDate ? new Date(rawData.deathDate) : null

            console.log("Edit form raw data:", rawData)
            console.log("Country value:", rawData.country)
            console.log("Occupation value:", rawData.occupation)
            console.log("Birth date:", birthDate)
            console.log("Death date:", deathDate)

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
            }

            console.log("Updating family member with ID:", resolvedId)
            console.log("Update data:", updatedData)

            await updateFamilyMember(token, resolvedId, updatedData)
            console.log("Family member updated successfully, fetching data...")

            // Explicitly trigger the check for similar family members
            try {
              console.log("Triggering check for similar family members...")
              const response = await fetch(
                `http://localhost:3001/notifications/check-similar-family-members/${resolvedId}`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                },
              )

              if (response.ok) {
                console.log("Similar family members check completed successfully")
              } else {
                console.error("Failed to check for similar family members:", await response.text())
              }
            } catch (error) {
              console.error("Error checking for similar family members:", error)
            }

            await props.fetchData()
            console.log("Data fetched successfully, including new suggestion counts")

            // Force a complete tree redraw and ensure badges are properly attached
            setTimeout(() => {
              console.log("Forcing redraw to update suggestion badges")
              family.draw()

              // Wait for the redraw to complete, then attach badge event handlers
              setTimeout(() => {
                // First, handle SVG badges
                const svgBadges = document.querySelectorAll(".suggestion-badge-svg")
                svgBadges.forEach((badge) => {
                  const nodeElement = badge.closest("[data-n-id]")
                  if (!nodeElement) return

                  const nodeId = nodeElement.getAttribute("data-n-id")
                  if (!nodeId) return

                  // Clone and replace to remove old listeners
                  const newBadge = badge.cloneNode(true)
                  if (badge.parentNode) {
                    badge.parentNode.replaceChild(newBadge, badge)
                  }
                  // Add fresh click handler
                  ;(newBadge as any).style.cursor = "pointer"
                  newBadge.addEventListener("click", (e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    console.log(`SVG Badge clicked for node ${nodeId}, redirecting`)
                    window.location.href = `/dashboard/suggestions/${nodeId}`
                    return false
                  })
                })

                // Second, handle custom badges
                const customBadges = document.querySelectorAll(".custom-suggestion-badge")
                customBadges.forEach((badge) => {
                  // Update href attribute to ensure it has the correct ID
                  const nodeElement = badge.closest("[data-n-id]")
                  if (!nodeElement) return

                  const nodeId = nodeElement.getAttribute("data-n-id")
                  if (!nodeId) return
                  ;(badge as HTMLAnchorElement).href = `/dashboard/suggestions/${nodeId}`

                  // Ensure click handler is working
                  badge.addEventListener("click", (e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    console.log(`Custom badge clicked for node ${nodeId}, redirecting`)
                    window.location.href = `/dashboard/suggestions/${nodeId}`
                  })
                })
              }, 500)
            }, 300)
          } catch (error) {
            console.error("Error saving updated member:", error)
          }
        })()

        // Keep the event listener as a fallback but modify it to stop propagation and prevent default
        treeElement.addEventListener(
          "click",
          (e) => {
            const target = e.target as Element

            // Check for badge elements
            const badgeElement = target.closest('[data-suggestion-badge="true"]')
            if (badgeElement) {
              e.stopPropagation()
              e.preventDefault()

              const nodeId = badgeElement.getAttribute("data-node-id")
              if (nodeId) {
                console.log("Badge clicked via event listener, redirecting to:", nodeId)
                try {
                  const idStr = String(nodeId) // Ensure ID is a string
                  window.location.href = `/dashboard/suggestions/${encodeURIComponent(idStr)}`
                } catch (error) {
                  console.error("Error redirecting to suggestions page:", error)
                }
                return
              }

              // If the badge doesn't have a data-node-id attribute, look for the parent node
              const nodeElement = badgeElement.closest("[data-n-id]")
              if (nodeElement) {
                const nodeId = nodeElement.getAttribute("data-n-id")
                if (nodeId) {
                  console.log("Badge clicked via parent lookup, redirecting to:", nodeId)
                  window.location.href = `/dashboard/suggestions/${nodeId}`
                  return
                }
              }
            }
          },
          true,
        ) // Use capture phase to get events before they bubble up

        // Override how the form sets the title
        FamilyTree.editUI.prototype._createFormElements = function () {
          const originalCreateFormElements = FamilyTree.editUI.prototype._createFormElements
          const result = originalCreateFormElements.apply(this, arguments)

          // Find and update the edit form title
          setTimeout(() => {
            const titleElement = document.querySelector(".bft-edit-form-title")
            if (titleElement && this.obj && this.node) {
              const nodeData = this.obj._get(this.node.id)
              if (nodeData) {
                const fullName = `${nodeData.name || ""} ${nodeData.surname || ""}`.trim()
                if (fullName) {
                  titleElement.textContent = fullName
                }
              }
            }
          }, 0)

          return result
        }

        return true
      })
      const nodeBinding = props.nodeBinding

      const canDeleteMember = (node: any) => {
        const hasPartner = node.pids && node.pids.length > 0
        const hasChildren = props.nodes.some((member: any) => member.fid === node.id || member.mid === node.id)
        const hasParents = node.fid || node.mid

        // Case 1: Child without spouse/children
        if (hasParents && !hasPartner && !hasChildren) return true

        // Case 2: Root couple with descendants
        if (hasChildren && hasPartner && !hasParents) return true

        // Case 3: Root single parent with descendants
        if (hasChildren && !hasPartner && !hasParents) return true

        // Case 4: Root couple without children
        if (!hasChildren && hasPartner && !hasParents) return true

        return false
      }

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

      familyAny.nodeCircleMenuUI.on("show", (sender, args) => {
        var node = family.getNode(args.nodeId)
        delete args.menu.father
        delete args.menu.mother
        delete args.menu.wife
        delete args.menu.husband

        args.menu.medicalHistory = {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-heart-pulse"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4 .5-1h6.7"/></svg>`,
          text: "Medical History",
          color: "#1F2937",
        }

        // Add parent options
        if (FamilyTree.isNEU(node.mid)) {
          args.menu.mother = {
            icon: (FamilyTree.icon as any).mother(24, 24, "#ec4899"),
            text: "Add mother",
            color: "#1F2937",
          }
        }

        if (FamilyTree.isNEU(node.fid)) {
          args.menu.father = {
            icon: (FamilyTree.icon as any).father(24, 24, "#3b82f6"),
            text: "Add father",
            color: "#1F2937",
          }
        }

        // Check if node has a partner
        const hasPartner = (node as any).pids && (node as any).pids.length > 0
        const partner = hasPartner ? family.getNode((node as any).pids[0]) : null

        // Add children options
        if (hasPartner) {
          args.menu.addSon = {
            icon: (FamilyTree.icon as any).son(24, 24, "#3b82f6"),
            text: `Add Son with partner`,
            color: "#1F2937",
          }
          args.menu.addDaughter = {
            icon: (FamilyTree.icon as any).daughter(24, 24, "#ec4899"),
            text: `Add Daughter with partner`,
            color: "#1F2937",
          }
        } else {
          args.menu.addSon = {
            icon: (FamilyTree.icon as any).son(24, 24, "#3b82f6"),
            text: "Add Son",
            color: "#1F2937",
          }
          args.menu.addDaughter = {
            icon: (FamilyTree.icon as any).daughter(24, 24, "#ec4899"),
            text: "Add Daughter",
            color: "#1F2937",
          }
        }

        // Add partner option if no partner exists
        if (!hasPartner) {
          if ((node as any).gender === "male") {
            args.menu.wife = {
              icon: (FamilyTree.icon as any).wife(24, 24, "#ec4899"),
              text: "Add wife",
              color: "#1F2937",
            }
          } else if ((node as any).gender === "female") {
            args.menu.husband = {
              icon: (FamilyTree.icon as any).husband(24, 24, "#3b82f6"),
              text: "Add husband",
              color: "#1F2937",
            }
          }
        }
      })

      familyAny.nodeCircleMenuUI.on("click", async (sender, args): Promise<boolean | void> => {
        const node = family.getNode(args.nodeId) as any
        const token = localStorage.getItem("token")
        if (!token) return

        try {
          switch (args.menuItemName) {
            case "deleteNode": {
              if (!canDeleteMember(node)) {
                alert("Cannot delete this member as it would break the family tree structure.")
                return
              }

              if (!confirm("Are you sure you want to delete this family member?")) {
                return
              }

              await deleteFamilyMember(token, node.id as string)
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
                fatherId: undefined as any,
                motherId: undefined as any,
              }

              if (node.gender === "male") {
                newMemberData.fatherId = node.id
                if (node.pids && node.pids[0]) {
                  newMemberData.motherId = node.pids[0]
                }
              } else {
                newMemberData.motherId = node.id
                if (node.pids && node.pids[0]) {
                  newMemberData.fatherId = node.pids[0]
                }
              }

              await handleAddMember(token, node, gender === "male" ? "son" : "daughter", props.fetchData, newMemberData)

              // After adding a member, force tree redraw and reattach badge handlers
              setTimeout(() => {
                family.draw()
                setTimeout(() => {
                  // Handle SVG badges
                  document.querySelectorAll(".suggestion-badge-svg").forEach((badge) => {
                    const nodeElement = badge.closest("[data-n-id]")
                    if (!nodeElement) return

                    const nodeId = nodeElement.getAttribute("data-n-id")
                    if (!nodeId) return

                    badge.addEventListener("click", (e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      window.location.href = `/dashboard/suggestions/${nodeId}`
                    })
                  })

                  // Handle custom badges
                  document.querySelectorAll(".custom-suggestion-badge").forEach((badge) => {
                    const nodeElement = badge.closest("[data-n-id]")
                    if (!nodeElement) return

                    const nodeId = nodeElement.getAttribute("data-n-id")
                    if (!nodeId) return
                    ;(badge as HTMLAnchorElement).href = `/dashboard/suggestions/${nodeId}`
                    badge.addEventListener("click", (e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      window.location.href = `/dashboard/suggestions/${nodeId}`
                    })
                  })
                }, 500)
              }, 300)

              break
            }
            case "father":
              await handleAddMember(token, node, "father", props.fetchData)
              break
            case "mother":
              await handleAddMember(token, node, "mother", props.fetchData)
              break
            case "wife":
              await handleAddMember(token, node, "wife", props.fetchData)
              break
            case "husband":
              await handleAddMember(token, node, "husband", props.fetchData)
              break
            case "medicalHistory":
              // Navigate to the medical history page with the member ID
              window.location.href = `/dashboard/medical-history/${node.id}`
              break
            case "editNode":
              family.editUI.show(args.nodeId)
              break
            default:
              break
          }
        } catch (error) {
          console.error("Error handling member addition:", error)
        }
        return true
      })
    }
  }, [props.nodeBinding, props.nodes, props.fetchData])

  return (
    <div className="h-full w-full">
      <div id="tree" ref={treeContainer} className="h-full w-full bg-gray-50 dark:bg-slate-900"></div>
    </div>
  )
}

// Update the TreeViewPage component to add more content and reduce whitespace
export default function TreeViewPage() {
  const router = useRouter()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilters, setActiveFilters] = useState({
    gender: "all",
    country: "all",
    status: "all",
  })
  const [treeKey, setTreeKey] = useState(0)
  const [stats, setStats] = useState({
    totalMembers: 0,
    generations: 0,
    totalSuggestions: 0,
    oldestMember: null as any,
    youngestMember: null as any,
  })
  const { generatePublicLink } = useTreeStore()
  const [isAIChatOpen, setIsAIChatOpen] = useState(false)
  const [allFamilyData, setAllFamilyData] = useState<any[]>([])

  useEffect(() => {
    async function fetchAllData() {
      const token = localStorage.getItem("token")
      if (!token) return
      // 1. Fetch all family members
      const res = await fetch("http://localhost:3001/family-members", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const familyMembers = (await res.json()).data || []
      // 2. For each member, fetch their medical history
      const allData = await Promise.all(
        familyMembers.map(async (member: any) => {
          let medicalHistory = null
          try {
            const medRes = await fetch(`http://localhost:3001/medical-history/family-member/${member._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            if (medRes.ok) {
              medicalHistory = (await medRes.json()).data
            }
          } catch {}
          return { ...member, medicalHistory }
        }),
      )
      setAllFamilyData(allData)
    }
    fetchAllData()
  }, [])

  // Define a handler function for filter changes
  const handleFilterChange = (name: string, value: string) => {
    console.log(`Filter changed: ${name} = ${value}`)

    // Update the filter state and trigger re-fetch
    setActiveFilters((prev) => {
      const newFilters = {
        ...prev,
        [name]: value,
      }
      console.log("New filters:", newFilters)
      return newFilters
    })

    // Show loading state immediately
    setLoading(true)
  }

  // Update the useEffect for filters to ensure they trigger properly
  useEffect(() => {
    console.log("Filter effect triggered with:", activeFilters)
    fetchData()
  }, [activeFilters])

  // When data changes, increment treeKey to force Familytree remount
  useEffect(() => {
    setTreeKey((prev) => prev + 1)
  }, [data])

  async function fetchData() {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      console.log("Fetching data with filters:", activeFilters)

      // Use the fetchFilteredFamilyMembers function from familyService
      try {
        const members = await fetchFilteredFamilyMembers(token, activeFilters)
        console.log("API returned members:", members)

        if (!members || members.length === 0) {
          setData([])
          setStats({
            totalMembers: 0,
            generations: 0,
            totalSuggestions: 0,
            oldestMember: null,
            youngestMember: null,
          })
          return
        }

        // Strictly filter nodes on the frontend
        const strictFiltered = members.filter(
          (m: any) =>
            (activeFilters.gender === "all" || m.gender === activeFilters.gender) &&
            (activeFilters.country === "all" || m.country === activeFilters.country) &&
            (activeFilters.status === "all" || m.status === activeFilters.status),
        )

        const allowedIds = new Set(strictFiltered.map((m: any) => m._id?.toString?.() ?? m.id?.toString?.()))

        // Fetch suggestion counts for each member
        let totalSuggestionsCount = 0
        const processedDataPromises = strictFiltered.map(async (member: any) => {
          // Use the fixed getMemberSuggestionCount function which now exactly matches the suggestions page logic
          const filteredSuggestionCount = await getMemberSuggestionCount(token, member._id)

          console.log(`Member ${member.name}: Found ${filteredSuggestionCount} valid suggestions after filtering`)

          // Add this member's filtered count to the total
          totalSuggestionsCount += filteredSuggestionCount

          // Format dates properly for display and edit form
          const formattedBirthDate = member.birthDate ? new Date(member.birthDate).toISOString().split("T")[0] : ""
          const formattedDeathDate = member.deathDate ? new Date(member.deathDate).toISOString().split("T")[0] : ""

          // Clean up references
          const pids = Array.isArray(member.partnerId)
            ? member.partnerId.filter((id: string) => allowedIds.has(id?.toString?.()))
            : []
          const mid =
            member.motherId && allowedIds.has(member.motherId.toString()) ? member.motherId.toString() : undefined
          const fid =
            member.fatherId && allowedIds.has(member.fatherId.toString()) ? member.fatherId.toString() : undefined

          let imageUrl = member.imageUrl
          if (!imageUrl || imageUrl.trim() === "") {
            imageUrl = member.gender === "female" ? femaleAvatar : maleAvatar
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
            country: member.country || "",
            occupation: member.occupation || "",
            tags: Array.isArray(member.tags) ? member.tags.join(", ") : "",
            imageUrl,
            // Use the filtered count that exactly matches the suggestions page
            suggestionCount: filteredSuggestionCount.toString(),
            actualSuggestionCount: filteredSuggestionCount, // Using same count for both fields
          }
        })

        // Wait for all the suggestion counts to be fetched
        const processedData = await Promise.all(processedDataPromises)

        setData(processedData)

        // Calculate family statistics
        if (processedData.length > 0) {
          // Find the maximum generation depth
          const findGenerationDepth = (memberId: string, depth = 1, visited = new Set<string>()): number => {
            if (visited.has(memberId)) return depth
            visited.add(memberId)

            const member = processedData.find((m) => m.id === memberId)
            if (!member) return depth

            const children = processedData.filter((m) => m.fid === memberId || m.mid === memberId)
            if (children.length === 0) return depth

            return Math.max(...children.map((child) => findGenerationDepth(child.id, depth + 1, new Set(visited))))
          }

          // Find root members (those without parents)
          const rootMembers = processedData.filter((m) => !m.fid && !m.mid)
          const maxGeneration =
            rootMembers.length > 0 ? Math.max(...rootMembers.map((m) => findGenerationDepth(m.id))) : 1

          setStats({
            totalMembers: processedData.length,
            generations: maxGeneration,
            totalSuggestions: totalSuggestionsCount,
            oldestMember: processedData.reduce((oldest, current) => {
              if (
                !oldest ||
                (oldest.birthDate && current.birthDate && new Date(current.birthDate) < new Date(oldest.birthDate))
              ) {
                return current
              }
              return oldest
            }, null),
            youngestMember: processedData.reduce((youngest, current) => {
              if (
                !youngest ||
                (youngest.birthDate && current.birthDate && new Date(current.birthDate) > new Date(youngest.birthDate))
              ) {
                return current
              }
              return youngest
            }, null),
          })
        }
      } catch (error) {
        console.error("Error fetching filtered family members:", error)
        throw error
      }
    } catch (error) {
      console.error("Error fetching family tree data:", error)
      setError(error instanceof Error ? error.message : "Failed to load family tree data")
    } finally {
      setLoading(false)
    }
  }

  // Add an effect that listens to activeFilters changes
  useEffect(() => {
    fetchData()
  }, [activeFilters]) // Re-fetch data when filters change

  // Keep the existing useEffect for initial data load
  useEffect(() => {
    // Check if we just logged in or registered
    const justLoggedIn = sessionStorage.getItem("justAuthenticated")
    if (justLoggedIn) {
      fetchData()
      sessionStorage.removeItem("justAuthenticated")
    }

    // Set up event listener for auth events to refresh tree data
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" && e.newValue) {
        // New login or registration detected, refresh data
        fetchData()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const nodeBinding = {
    field_0: "name",
    field_1: "surname",
    field_4: "birthDate",
    field_9: "suggestionCount", // Keep suggestion count binding
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
      className="min-h-screen bg-black text-white font-sans relative"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/tree-connections.svg')] bg-center opacity-15 pointer-events-none" />

      {/* Animated Background */}
      <AnimatedNodes />

      <div className="container mx-auto px-4 py-8 relative max-w-7xl">
        {/* Header Section */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push("/dashboard/main")}
              className="group flex items-center gap-3 text-gray-400 hover:text-teal-400 transition-all duration-200 cursor-pointer"
            >
              <div className="p-2 rounded-lg bg-gray-800/50 group-hover:bg-teal-900/30 transition-colors">
                <svg
                  className="w-5 h-5 transition-transform group-hover:-translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              <span className="font-medium">Back to Dashboard</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <TreePine className="h-4 w-4 text-teal-400" />
                <span className="text-sm text-gray-300">Family Tree Explorer</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Discover Your Family Heritage
            </h1>
            <p className="text-gray-400 max-w-3xl mx-auto text-lg">
              Explore your family connections, uncover hidden relationships, and visualize your ancestral journey
              through an interactive family tree experience.
            </p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {!loading && !error && data.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="group rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm p-6 border border-gray-700/50 hover:border-teal-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-teal-500/20 rounded-lg">
                  <Users className="h-6 w-6 text-teal-400" />
                </div>
                <span className="text-xs text-teal-400 font-medium px-2 py-1 bg-teal-500/10 rounded-full">Active</span>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Family Members</h3>
              <p className="text-3xl font-bold text-white">{stats.totalMembers}</p>
            </div>

            <div className="group rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm p-6 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-400" />
                </div>
                <span className="text-xs text-blue-400 font-medium px-2 py-1 bg-blue-500/10 rounded-full">Depth</span>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Generations</h3>
              <p className="text-3xl font-bold text-white">{stats.generations}</p>
            </div>

            <div className="group rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm p-6 border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Heart className="h-6 w-6 text-purple-400" />
                </div>
                <span className="text-xs text-purple-400 font-medium px-2 py-1 bg-purple-500/10 rounded-full">
                  Elder
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Oldest Member</h3>
              <div>
                <p className="text-xl font-bold text-white truncate">{stats.oldestMember?.name || "N/A"}</p>
                <p className="text-sm text-gray-500">{stats.oldestMember?.birthDate ? new Date(stats.oldestMember.birthDate).toISOString().slice(0, 10) : "Unknown"}</p>
              </div>
            </div>

            <div className="group rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm p-6 border border-gray-700/50 hover:border-orange-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <Sparkles className="h-6 w-6 text-orange-400" />
                </div>
                <span className="text-2xl font-bold text-orange-400">{stats.totalSuggestions}</span>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">AI Suggestions</h3>
              <p className="text-sm text-gray-300">Orange badges show available suggestions for each member</p>
            </div>
          </motion.div>
        )}

        {/* Main Tree Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-800/60 backdrop-blur-sm border border-gray-700/50 overflow-hidden mb-8 shadow-2xl"
        >
          {/* Tree Header */}
          <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 p-6 border-b border-gray-700/50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500/20 rounded-lg">
                  <TreePine className="h-6 w-6 text-teal-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Interactive Family Tree</h2>
                  <p className="text-sm text-gray-400">Explore relationships and discover connections</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  className={`flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-white text-sm rounded-lg transition-all duration-200 border border-gray-600/50 ${
                    activeFilters.gender === "all" && activeFilters.country === "all" && activeFilters.status === "all"
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:border-gray-500/50"
                  }`}
                  onClick={() => {
                    if (
                      activeFilters.gender !== "all" ||
                      activeFilters.country !== "all" ||
                      activeFilters.status !== "all"
                    ) {
                      setActiveFilters({
                        gender: "all",
                        country: "all",
                        status: "all",
                      })
                      setLoading(true)
                    }
                  }}
                  disabled={
                    activeFilters.gender === "all" && activeFilters.country === "all" && activeFilters.status === "all"
                  }
                >
                  <Settings className="h-4 w-4" />
                  Reset Filters
                </button>

                <button
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white text-sm rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  onClick={handleShareTree}
                >
                  <Share2 className="h-4 w-4" />
                  Share Tree
                </button>

                <Link href="/dashboard/health-overview">
                  <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl">
                    <Heart className="h-4 w-4" />
                    Health Overview
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="bg-gray-800/30 p-4 border-b border-gray-700/50">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-teal-400" />
                <span className="text-sm font-medium text-gray-300">Filters:</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  className={`bg-gray-800/80 text-white text-sm rounded-lg px-3 py-2 border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${
                    activeFilters.gender !== "all"
                      ? "border-teal-500/50 bg-teal-900/20"
                      : "border-gray-600/50 hover:border-gray-500/50"
                  }`}
                  value={activeFilters.gender}
                  onChange={(e) => handleFilterChange("gender", e.target.value)}
                >
                  <option value="all">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>

                <select
                  className={`bg-gray-800/80 text-white text-sm rounded-lg px-3 py-2 border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${
                    activeFilters.country !== "all"
                      ? "border-teal-500/50 bg-teal-900/20"
                      : "border-gray-600/50 hover:border-gray-500/50"
                  }`}
                  value={activeFilters.country}
                  onChange={(e) => handleFilterChange("country", e.target.value)}
                >
                  <option value="all">All Countries</option>
                  <option value="Philippines">Philippines</option>
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                  <option value="Japan">Japan</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Hong Kong">Hong Kong</option>
                </select>

                <select
                  className={`bg-gray-800/80 text-white text-sm rounded-lg px-3 py-2 border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${
                    activeFilters.status !== "all"
                      ? "border-teal-500/50 bg-teal-900/20"
                      : "border-gray-600/50 hover:border-gray-500/50"
                  }`}
                  value={activeFilters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="alive">Alive</option>
                  <option value="dead">Dead</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {(activeFilters.gender !== "all" || activeFilters.country !== "all" || activeFilters.status !== "all") && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-400">Active:</span>
                {activeFilters.gender !== "all" && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Gender: {activeFilters.gender}
                  </span>
                )}
                {activeFilters.country !== "all" && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Country: {activeFilters.country}
                  </span>
                )}
                {activeFilters.status !== "all" && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Status: {activeFilters.status}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Family Tree Content */}
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col justify-center items-center h-96 p-8"
            >
              <div className="relative mb-6">
                <div className="h-16 w-16 rounded-full border-4 border-teal-500/20 border-t-teal-500 animate-spin"></div>
                <div
                  className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-r-blue-500/50 animate-spin"
                  style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
                ></div>
              </div>
              <p className="text-teal-300 text-lg font-medium">Loading your family tree...</p>
              <p className="text-gray-400 text-sm mt-2">Discovering connections and relationships</p>
            </motion.div>
          ) : error ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-12 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-red-400 mb-2">Something went wrong</h3>
                <p className="text-gray-400 mb-6">{error}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchData()}
                className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white rounded-lg transition-all duration-300 shadow-lg"
              >
                Try Again
              </motion.button>
            </motion.div>
          ) : data.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 text-center">
              {activeFilters.gender !== "all" || activeFilters.country !== "all" || activeFilters.status !== "all" ? (
                <div>
                  <div className="w-16 h-16 mx-auto bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No matches found</h3>
                  <p className="text-gray-400 mb-6">No family members match your current filter criteria.</p>
                  <button
                    onClick={() => {
                      setActiveFilters({
                        gender: "all",
                        country: "all",
                        status: "all",
                      })
                      setLoading(true)
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white rounded-lg transition-all duration-300 shadow-lg"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 mx-auto bg-teal-500/20 rounded-full flex items-center justify-center mb-4">
                    <TreePine className="w-8 h-8 text-teal-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Start Your Family Tree</h3>
                  <p className="text-gray-400 mb-6">
                    Your family tree is empty. Begin your journey by adding your first family member.
                  </p>
                  <button className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white rounded-lg transition-all duration-300 shadow-lg">
                    Add First Member
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
              <div className="p-4">
                <div id="tree" className="w-full h-[1100px] rounded-lg overflow-hidden"></div>
                <Familytree key={treeKey} nodes={data} nodeBinding={nodeBinding} fetchData={fetchData} />
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="group rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-800/60 backdrop-blur-sm p-6 border border-gray-700/50 hover:border-teal-500/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-teal-500/20 rounded-lg group-hover:bg-teal-500/30 transition-colors">
                <Navigation className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Navigation Tips</h3>
            </div>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-teal-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Click and drag to pan around the tree</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-teal-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Use mouse wheel to zoom in and out</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-teal-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Use the search bar to find specific family members</span>
              </li>
            </ul>
          </div>

          <div className="group rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-800/60 backdrop-blur-sm p-6 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                <Edit className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Editing Members</h3>
            </div>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Click on a member to see available actions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Add parents, children, or partners with the circular menu</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Edit details like birth dates and status</span>
              </li>
            </ul>
          </div>

          <div className="group rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-800/60 backdrop-blur-sm p-6 border border-gray-700/50 hover:border-orange-500/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/30 transition-colors">
                <Sparkles className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">AI Suggestions</h3>
            </div>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Click the orange badge to see suggestions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Add preset family members to your tree</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Discover potential family connections</span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Additional Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-xl bg-gradient-to-r from-teal-900/20 to-blue-900/20 backdrop-blur-sm p-6 border border-teal-500/20"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-teal-500/20 rounded-lg">
              <Info className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Getting Started</h3>
              <p className="text-gray-300 mb-4">
                Welcome to your family tree explorer! This interactive visualization helps you understand your family
                connections and discover new relationships through AI-powered suggestions.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Interactive Navigation
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Smart Filtering
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  AI Suggestions
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* AI Chat Components */}
      <AIChatSidebar
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        allFamilyData={allFamilyData}
        title="Family Tree Analysis"
      />
      <AIChatToggle onClick={() => setIsAIChatOpen(!isAIChatOpen)} isOpen={isAIChatOpen} />
    </motion.div>
  )
}
