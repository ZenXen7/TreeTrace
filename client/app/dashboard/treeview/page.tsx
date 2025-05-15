"use client";

import { useEffect, useState, useRef } from "react"
import FamilyTree from "@balkangraph/familytree.js"
import { motion } from "framer-motion"
import { handleAddMember, updateFamilyMember, deleteFamilyMember, fetchFilteredFamilyMembers, getSurnameSimilaritiesCount, getMemberSuggestionCount } from "./service/familyService"
import { Filter, Share2 } from "lucide-react"
import useTreeStore from "@/store/useTreeStore"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"
import AnimatedNodes from "@/components/animated-nodes"
import HealthConditionsModal from "@/components/HealthConditionsModal"
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
  const treeContainer = useRef<HTMLDivElement | null>(null);
  const [healthConditionsModal, setHealthConditionsModal] = useState({
    isOpen: false,
    familyMemberId: '',
    familyMemberName: ''
  });

  useEffect(() => {
    const treeElement = document.getElementById("tree");
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

      // Updated text positioning for larger node cards with better spacing
      FamilyTree.templates.tommy.field_0 = `<text class="bft-field-0" ${nameStyle} x="25" y="50">{val}</text>` // First name
      FamilyTree.templates.tommy.field_1 = `<text class="bft-field-1" ${nameStyle} x="25" y="75">{val}</text>` // Surname
      
      // Gender field with more space from top
      FamilyTree.templates.tommy.field_2 = `<text class="bft-field-2" ${roleStyle} x="25" y="100">{val}</text>`
      
      // Occupation with icon and better spacing
      FamilyTree.templates.tommy.field_7 = `<text class="bft-field-7" ${roleStyle} x="140" y="100">💼 {val}</text>`
      
      // Birth/Death dates with more bottom padding
      FamilyTree.templates.tommy.field_4 = `<text class="bft-field-4" ${detailStyle} x="25" y="125">Birth: {val}</text>`
      FamilyTree.templates.tommy.field_5 = `<text class="bft-field-5" ${detailStyle} x="150" y="125">Death: {val}</text>`
      
      // Remove any unused fields from previous template
      FamilyTree.templates.tommy.field_3 = ``; 
      FamilyTree.templates.tommy.field_6 = ``;
      FamilyTree.templates.tommy.field_8 = ``;

      // Initialize SVG with our custom suggestion badge definitions
      FamilyTree.templates.tommy.field_9 = `
        <g class="suggestion-badge-svg" data-suggestion-badge="true" transform="translate(20, 20)" style="cursor:pointer;">
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feFlood flood-color="#FFA500" flood-opacity="0.3" result="color"/>
            <feComposite in="color" in2="blur" operator="in" result="glow"/>
            <feMerge>
              <feMergeNode in="glow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <circle cx="0" cy="0" r="18" fill="#F97316" stroke="#FFFFFF" stroke-width="3" filter="url(#glow)"></circle>
          <text x="0" y="0" text-anchor="middle" dominant-baseline="central" font-size="16px" font-weight="bold" fill="white">{val}</text>
          <circle cx="0" cy="0" r="18" fill="none" stroke="#F97316" stroke-width="2" opacity="0.5" class="pulse-circle">
            <animate attributeName="r" from="18" to="28" dur="1.5s" begin="0s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" begin="0s" repeatCount="indefinite"/>
          </circle>
        </g>
      `;

      // Copy the suggestion badge to other templates
      FamilyTree.templates.tommy_female.field_9 = FamilyTree.templates.tommy.field_9;
      FamilyTree.templates.tommy_male.field_9 = FamilyTree.templates.tommy.field_9;

      // Enhanced family tree node templates with larger size and better padding
      FamilyTree.templates.tommy.node = `
<g filter="url(#card-shadow)">
  <!-- Card background with rounded corners and subtle gradient -->
  <rect x="0" y="0" height="160" width="280" rx="15" ry="15" fill="#1F2937" stroke="#374151" strokeWidth="1.5"/>
  
  <!-- Gender-neutral accent -->
  <rect x="0" y="0" height="10" width="280" rx="10" ry="0" fill="#80cbc4"/>
  
  <!-- Small icon placeholder for gender icon at top right -->
  <circle cx="255" cy="30" r="15" fill="#374151" stroke="#4B5563" strokeWidth="1.5"/>
</g>
`
      FamilyTree.templates.tommy_female.node = `
<g filter="url(#card-shadow)">
  <!-- Card background with rounded corners and subtle gradient -->
  <rect x="0" y="0" height="160" width="280" rx="15" ry="15" fill="#1F2937" stroke="#374151" strokeWidth="1.5"/>
  
  <!-- Female accent -->
  <rect x="0" y="0" height="10" width="280" rx="10" ry="0" fill="#EC4899"/>
  
  <!-- Female icon placeholder at top right -->
  <circle cx="255" cy="30" r="15" fill="#EC4899" stroke="#4B5563" strokeWidth="1.5"/>
  <!-- Female symbol -->
  <path d="M255,22 L255,29 M251,25 L259,25 M255,29 L255,38 M250,34 L260,34" stroke="white" stroke-width="2" fill="none" />
</g>
`;

      FamilyTree.templates.tommy_male.node = `
<g filter="url(#card-shadow)">
  <!-- Card background with rounded corners and subtle gradient -->
  <rect x="0" y="0" height="160" width="280" rx="15" ry="15" fill="#1F2937" stroke="#374151" strokeWidth="1.5"/>
  
  <!-- Male accent -->
  <rect x="0" y="0" height="10" width="280" rx="10" ry="0" fill="#3B82F6"/>
  
  <!-- Male icon placeholder at top right -->
  <circle cx="255" cy="30" r="15" fill="#3B82F6" stroke="#4B5563" strokeWidth="1.5"/>
  <!-- Male symbol -->
  <path d="M250,23 L260,33 M260,23 L260,33 L250,33" stroke="white" stroke-width="2" fill="none" />
</g>
`;

      // Add a style element to hide the avatar in edit forms
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .bft-edit-form-avatar, #bft-avatar, div[id="bft-avatar"] {
          display: none !important;
        }
        .bft-edit-form-title {
          margin-top: 20px !important;
        }
      `;
      document.head.appendChild(styleElement);

      // Add a script to replace any "Unknown" text in the header with the person's name
      // Only add the script if it doesn't already exist
      if (!document.getElementById('tree-trace-form-fixer')) {
        const script = document.createElement('script');
        script.id = 'tree-trace-form-fixer';
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
        `;
        document.head.appendChild(script);
      }

      // Update the node menu button position for the larger cards
      FamilyTree.templates.tommy.nodeCircleMenuButton =
        FamilyTree.templates.tommy_female.nodeCircleMenuButton =
        FamilyTree.templates.tommy_male.nodeCircleMenuButton =
          {
            radius: 20,
            x: 250,
            y: 120,
            color: "#1F2937",
            stroke: "#4B5563",
            strokeWidth: 2,
            hoverColor: "#374151",
            hoverStroke: "#00CCAA",
          };
          
      // Apply the same field styling to male and female templates
      for (let i = 0; i <= 9; i++) {
        FamilyTree.templates.tommy_female[`field_${i}`] = FamilyTree.templates.tommy[`field_${i}`];
        FamilyTree.templates.tommy_male[`field_${i}`] = FamilyTree.templates.tommy[`field_${i}`];
      }

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
          photoBinding: "",
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
            // Health Conditions section - button that will open a modal
            { type: 'textbox', label: 'Manage Health Conditions', binding: 'healthConditions' }
          ],
          buttons: {
            edit: {
              text: 'Update'
            },
            share: {
              text: 'Share'
            },
            pdf: {
              text: 'Export PDF'
            }
          }
        },

        // Optimized spacing and layout for improved node design
        levelSeparation: 160,
        siblingSeparation: 90,
        subtreeSeparation: 120,
        padding: 50,
        orientation: FamilyTree.orientation.top,
        layout: FamilyTree.layout.normal,
        scaleInitial: FamilyTree.match.boundary,
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
            "stroke-opacity": "0.8"
          },
        },
      });

      // Add event listener for tree initialization
      family.on("init", function() {
        console.log("Tree initialized");
      });
      
      // Add event listener to remove the avatar from edit forms
      family.editUI.on("show", function(sender, args) {
        setTimeout(() => {
          // Hide avatar elements in the edit form
          const avatarElement = document.querySelector('.bft-edit-form-avatar');
          if (avatarElement) {
            (avatarElement as HTMLElement).style.display = 'none';
          }
          
          const bftAvatar = document.getElementById('bft-avatar');
          if (bftAvatar) {
            bftAvatar.style.display = 'none';
          }
          
          // Update the title with the person's name and surname
          const titleElement = document.querySelector('.bft-edit-form-title');
          if (titleElement) {
            // Get the node data for the person being edited
            const nodeId = args.nodeId;
            const nodeData = family.get(nodeId);
            if (nodeData) {
              // Cast to any to access the name and surname properties
              const node = nodeData as any;
              // Create a display name from name and surname
              const displayName = `${node.name || ''} ${node.surname || ''}`.trim();
              if (displayName) {
                titleElement.textContent = displayName;
              }
            }
            
            (titleElement as HTMLElement).style.marginTop = '20px';
          }
        }, 100);
      });
      
      // Enhance the redraw event handler to ensure proper IDs are used
      family.on("redraw", function(sender: any) {
        console.log("Tree redrawn, checking for nodes with suggestions");
        
        try {
          // Get all nodes without parameters as per Balkan's API
          const nodes = (family as any).get();
          
          if (!nodes || !Array.isArray(nodes)) {
            console.warn("No nodes found or invalid nodes data");
            return;
          }
          
          // Get all nodes that have suggestions
          const nodesWithSuggestions = nodes.filter((node: any) => 
            (node.actualSuggestionCount && node.actualSuggestionCount > 0) ||
            (node.hasSimilarityMatch === true && (node.suggestionCount === undefined || parseInt(node.suggestionCount) > 0)) || 
            (node.tags && node.tags.includes("suggestion"))
          );
          
          console.log(`Found ${nodesWithSuggestions.length} nodes with suggestions`);
          
          // Process each node with suggestions to add our custom badge
          setTimeout(() => {
            nodesWithSuggestions.forEach((node: any) => {
              try {
                // Find the node's DOM element
                const nodeElement = document.querySelector(`[data-n-id="${node.id}"]`);
                if (!nodeElement) {
                  console.warn(`DOM element for node ${node.id} not found`);
                  return;
                }
                
                // Check if we already added a suggestion badge to this node
                const existingBadge = nodeElement.querySelector('.custom-suggestion-badge');
                if (existingBadge) {
                  console.log(`Badge already exists for node ${node.id}`);
                  return;
                }
                
                // Make sure we have a valid ID - not a template string
                const nodeId = String(node.id);
                console.log(`Creating badge for node ${nodeId} (type: ${typeof nodeId})`);
                
                // Create a larger, more prominent badge as a link
                const badgeLink = document.createElement('a');
                badgeLink.className = 'custom-suggestion-badge';
                badgeLink.href = `/dashboard/suggestions/${nodeId}`;
                
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
                `;
                
                // Add a pulsing effect with CSS animation
                const style = document.createElement('style');
                style.textContent = `
                  @keyframes pulse-badge {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                  }
                `;
                document.head.appendChild(style);
                
                // Show the suggestion count - THIS is where we need accuracy
                // Get the actual count from an API call if possible, or use the value directly
                const actualCount = node.actualSuggestionCount !== undefined 
                  ? node.actualSuggestionCount 
                  : (node.suggestionCount && node.suggestionCount !== '' ? parseInt(node.suggestionCount) : 0);
                
                // Only add the badge if there are actually suggestions to show
                if (actualCount <= 0) {
                  console.log(`No suggestions for node ${nodeId}, skipping badge`);
                  return; // Skip adding badge for nodes with 0 suggestions
                }
                
                badgeLink.textContent = actualCount.toString();
                
                // Add a click event just to ensure it works even if href doesn't
                badgeLink.addEventListener('click', (e) => {
                  // Redundant but ensures it works
                  window.location.href = `/dashboard/suggestions/${nodeId}`;
                });
                
                // Add badge to the node element
                (nodeElement as HTMLElement).style.position = 'relative';
                nodeElement.appendChild(badgeLink);
                
                console.log(`Added suggestion badge link for node ${nodeId}, redirecting to: ${badgeLink.href}`);
              } catch (error) {
                console.error(`Error adding badge to node ${node.id}:`, error);
              }
            });
          }, 200);
        } catch (error) {
          console.error("Error processing suggestions badges:", error);
        }
      });

      // Add event listener for tree render completion
      family.on("render", function() {
        console.log("Tree rendered, attaching badge click handlers");
        
        // Use setTimeout to ensure all elements are fully rendered
        setTimeout(() => {
          // Get all suggestion badges by class
          const badges = document.querySelectorAll('.suggestion-badge-svg');
          console.log(`Found ${badges.length} suggestion badges`);
          
          badges.forEach(badge => {
            // Find the parent node element that contains this badge
            const nodeElement = badge.closest('[data-n-id]');
            if (!nodeElement) return;
            
            // Get the actual node ID from the parent element
            const nodeId = nodeElement.getAttribute('data-n-id');
            if (!nodeId) return;
            
            console.log("Found badge for node:", nodeId);
            
            // Remove previous event listeners by cloning the element
            const newBadge = badge.cloneNode(true);
            if (badge.parentNode) {
              badge.parentNode.replaceChild(newBadge, badge);
            }
            
            // Make the badge clickable
            newBadge.style.cursor = 'pointer';
            
            // Add click event listener to the new badge
            newBadge.addEventListener('click', (e) => {
              e.stopPropagation();
              e.preventDefault();
              console.log("Badge clicked, navigating to suggestion for ID:", nodeId);
              
              // Navigate directly to the suggestions page with the real ID
              window.location.href = `/dashboard/suggestions/${nodeId}`;
            });
          });
        }, 500);
      });

      // Add event listener for node click instead of relying on template placeholders
      family.on("click", function(sender, args) {
        // If a family member is clicked directly (not a suggestion badge), normal behavior applies
        if (!args.event || !args.event.target) {
          return true; // Allow default behavior if no event target
        }
        
        // Check if a badge was clicked
        const badgeElement = args.event.target.closest('[data-suggestion-badge="true"]') || 
                            args.event.target.closest('.suggestion-badge-svg') ||
                            args.event.target.closest('.custom-suggestion-badge');
        
        if (!badgeElement) {
          return true; // Allow default behavior for non-badge clicks
        }
        
        // If we're here, a suggestion badge was clicked
        // Prevent the default node click behavior
        args.preventDefault();
        
        // Get the actual node data from the args
        const nodeId = args.node.id;
        console.log("Suggestion badge clicked via FamilyTree click event for node ID:", nodeId);
        
        // Navigate to the suggestions page with the real ID (ensure it's a string)
        const realNodeId = String(nodeId).replace(/{.*}/, '');
        window.location.href = `/dashboard/suggestions/${realNodeId}`;
        
        // Prevent default behavior
        return false;
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

    
          let birthDate = rawData.birthDate ? new Date(rawData.birthDate) : null
          let deathDate = rawData.deathDate ? new Date(rawData.deathDate) : null
          
          console.log("Edit form raw data:", rawData);
          console.log("Country value:", rawData.country);
          console.log("Occupation value:", rawData.occupation);
          console.log("Birth date:", birthDate);
          console.log("Death date:", deathDate);
          
          const updatedData = {
            name: rawData.name,
            surname: rawData.surname,
            gender: rawData.gender,
            status: rawData.status,
            birthDate: birthDate,
            deathDate: deathDate,
            country: rawData.country,
            occupation: rawData.occupation,
            tags: rawData.tags
          }
          
          console.log("Updating family member with ID:", resolvedId);
          console.log("Update data:", updatedData);

          await updateFamilyMember(token, resolvedId, updatedData)
          console.log("Family member updated successfully, fetching data...");
          
          // Explicitly trigger the check for similar family members
          try {
            console.log("Triggering check for similar family members...");
            const response = await fetch(`http://localhost:3001/notifications/check-similar-family-members/${resolvedId}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });
            
            if (response.ok) {
              console.log("Similar family members check completed successfully");
            } else {
              console.error("Failed to check for similar family members:", await response.text());
            }
          } catch (error) {
            console.error("Error checking for similar family members:", error);
          }
          
          await props.fetchData()
          console.log("Data fetched successfully, including new suggestion counts");

          // Force a complete tree redraw and ensure badges are properly attached
          setTimeout(() => {
            console.log("Forcing redraw to update suggestion badges");
            family.draw();
            
            // Wait for the redraw to complete, then attach badge event handlers
            setTimeout(() => {
              // First, handle SVG badges
              const svgBadges = document.querySelectorAll('.suggestion-badge-svg');
              svgBadges.forEach(badge => {
                const nodeElement = badge.closest('[data-n-id]');
                if (!nodeElement) return;
                
                const nodeId = nodeElement.getAttribute('data-n-id');
                if (!nodeId) return;
                
                // Clone and replace to remove old listeners
                const newBadge = badge.cloneNode(true);
                if (badge.parentNode) {
                  badge.parentNode.replaceChild(newBadge, badge);
                }
                
                // Add fresh click handler
                (newBadge as any).style.cursor = 'pointer';
                newBadge.addEventListener('click', (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  console.log(`SVG Badge clicked for node ${nodeId}, redirecting`);
                  window.location.href = `/dashboard/suggestions/${nodeId}`;
                  return false;
                });
              });
              
              // Second, handle custom badges
              const customBadges = document.querySelectorAll('.custom-suggestion-badge');
              customBadges.forEach(badge => {
                // Update href attribute to ensure it has the correct ID
                const nodeElement = badge.closest('[data-n-id]');
                if (!nodeElement) return;
                
                const nodeId = nodeElement.getAttribute('data-n-id');
                if (!nodeId) return;
                
                (badge as HTMLAnchorElement).href = `/dashboard/suggestions/${nodeId}`;
                
                // Ensure click handler is working
                badge.addEventListener('click', (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  console.log(`Custom badge clicked for node ${nodeId}, redirecting`);
                  window.location.href = `/dashboard/suggestions/${nodeId}`;
                });
              });
            }, 500);
          }, 300);
        } catch (error) {
          console.error("Error saving updated member:", error)
        }
      })()

      // Keep the event listener as a fallback but modify it to stop propagation and prevent default
      treeElement.addEventListener('click', (e) => {
        const target = e.target as Element;
        
        // Check for badge elements
        const badgeElement = target.closest('[data-suggestion-badge="true"]');
        if (badgeElement) {
          e.stopPropagation();
          e.preventDefault();
          
          const nodeId = badgeElement.getAttribute('data-node-id');
          if (nodeId) {
            console.log("Badge clicked via event listener, redirecting to:", nodeId);
            try {
              const idStr = String(nodeId); // Ensure ID is a string
              window.location.href = `/dashboard/suggestions/${encodeURIComponent(idStr)}`;
            } catch (error) {
              console.error("Error redirecting to suggestions page:", error);
            }
            return;
          }
          
          // If the badge doesn't have a data-node-id attribute, look for the parent node
          const nodeElement = badgeElement.closest('[data-n-id]');
          if (nodeElement) {
            const nodeId = nodeElement.getAttribute('data-n-id');
            if (nodeId) {
              console.log("Badge clicked via parent lookup, redirecting to:", nodeId);
              window.location.href = `/dashboard/suggestions/${nodeId}`;
              return;
            }
          }
        }
      }, true); // Use capture phase to get events before they bubble up

      // Override how the form sets the title
      FamilyTree.editUI.prototype._createFormElements = function() {
        const originalCreateFormElements = FamilyTree.editUI.prototype._createFormElements;
        const result = originalCreateFormElements.apply(this, arguments);
        
        // Find and update the edit form title
        setTimeout(() => {
          const titleElement = document.querySelector('.bft-edit-form-title');
          if (titleElement && this.obj && this.node) {
            const nodeData = this.obj._get(this.node.id);
            if (nodeData) {
              const fullName = `${nodeData.name || ''} ${nodeData.surname || ''}`.trim();
              if (fullName) {
                titleElement.textContent = fullName;
              }
            }
          }
        }, 0);
        
        return result;
      };

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
              
              // After adding a member, force tree redraw and reattach badge handlers
              setTimeout(() => {
                family.draw();
                setTimeout(() => {
                  // Handle SVG badges
                  document.querySelectorAll('.suggestion-badge-svg').forEach(badge => {
                    const nodeElement = badge.closest('[data-n-id]');
                    if (!nodeElement) return;
                    
                    const nodeId = nodeElement.getAttribute('data-n-id');
                    if (!nodeId) return;
                    
                    badge.addEventListener('click', (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      window.location.href = `/dashboard/suggestions/${nodeId}`;
                    });
                  });
                  
                  // Handle custom badges
                  document.querySelectorAll('.custom-suggestion-badge').forEach(badge => {
                    const nodeElement = badge.closest('[data-n-id]');
                    if (!nodeElement) return;
                    
                    const nodeId = nodeElement.getAttribute('data-n-id');
                    if (!nodeId) return;
                    
                    (badge as HTMLAnchorElement).href = `/dashboard/suggestions/${nodeId}`;
                    badge.addEventListener('click', (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      window.location.href = `/dashboard/suggestions/${nodeId}`;
                    });
                  });
                }, 500);
              }, 300);
              
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

  return (
    <div className="h-full w-full">
      <div
        id="tree"
        ref={treeContainer}
        className="h-full w-full bg-gray-50 dark:bg-slate-900"
      ></div>
      
      {/* Health Conditions Modal */}
      <HealthConditionsModal
        isOpen={healthConditionsModal.isOpen}
        onClose={() => setHealthConditionsModal(prev => ({ ...prev, isOpen: false }))}
        familyMemberId={healthConditionsModal.familyMemberId}
        familyMemberName={healthConditionsModal.familyMemberName}
      />
    </div>
  );
}

// Update the TreeViewPage component to add more content and reduce whitespace
export default function TreeViewPage() {
  const router = useRouter()
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
    totalSuggestions: 0,
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
            totalSuggestions: 0,
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

        // Fetch suggestion counts for each member
        let totalSuggestionsCount = 0;
        const processedDataPromises = strictFiltered.map(async (member:any) => {
          // Get raw suggestion count for this member
          const rawSuggestionCount = await getMemberSuggestionCount(token, member._id);
          
          // Get processed suggestions
          let processedSuggestions = [];
          try {
            const processedResponse = await fetch(`http://localhost:3001/notifications/processed-suggestions/${member._id}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
              }
            });
            
            if (processedResponse.ok) {
              const processedData = await processedResponse.json();
              processedSuggestions = processedData.data || [];
            }
          } catch (err) {
            console.warn(`Error fetching processed suggestions for ${member.name}:`, err);
          }
          
          // Get actual suggestions data to filter using same logic as suggestions page
          let filteredSuggestionCount = 0;
          try {
            const suggestionsResponse = await fetch(`http://localhost:3001/notifications/member-similarities/${member._id}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
              }
            });
            
            if (suggestionsResponse.ok) {
              const suggestionsData = await suggestionsResponse.json();
              
              // Apply the same filtering logic as the suggestions page
              if (suggestionsData && suggestionsData.data && suggestionsData.data.similarMembers) {
                // Filter out any suggestions that were already processed
                const filteredSimilarMembers = suggestionsData.data.similarMembers.map((similar: any) => ({
                  ...similar,
                  suggestions: similar.suggestions.filter(
                    (suggestion: string) => !processedSuggestions.includes(suggestion)
                  )
                })).filter((similar: any) => similar.suggestions.length > 0);
                
                // Count suggestions using the exact same logic as suggestions page
                filteredSuggestionCount = filteredSimilarMembers.reduce(
                  (count: number, member: { suggestions: string[] }) => count + member.suggestions.length, 0
                );
              }
            }
          } catch (err) {
            console.warn(`Error fetching suggestion details for ${member.name}:`, err);
          }
          
          // Add this member's filtered count to the total
          totalSuggestionsCount += filteredSuggestionCount;
          
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
            // Use the filtered count that exactly matches the suggestions page
            suggestionCount: filteredSuggestionCount.toString(),
            actualSuggestionCount: filteredSuggestionCount, // Using same count for both fields
          };
        });
        
        // Wait for all the suggestion counts to be fetched
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
            totalSuggestions: totalSuggestionsCount,
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
    field_9: "suggestionCount", // Add suggestion count binding
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

      <div className="container mx-auto px-2 py-8 relative max-w-[95%] xl:max-w-[90%]">
        <div className="mb-8 flex items-center">
          <button
            onClick={() => router.push("/dashboard/main")}
            className="flex items-center gap-2 text-gray-400 hover:text-teal-400 transition-colors duration-200"
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
          <h1 className="text-4xl font-semibold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent mb-3">
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
            <div className="rounded-xl bg-gray-900/30 backdrop-blur-sm p-6 border border-gray-800/50">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Family Members
              </h3>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-semibold text-white">
                  {stats.totalMembers}
                </p>
                <span className="text-sm text-teal-400">Active</span>
              </div>
            </div>
            <div className="rounded-xl bg-gray-900/30 backdrop-blur-sm p-6 border border-gray-800/50">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Generations
              </h3>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-semibold text-white">
                  {stats.generations}
                </p>
                <span className="text-sm text-teal-400">Depth</span>
              </div>
            </div>
            <div className="rounded-xl bg-gray-900/30 backdrop-blur-sm p-6 border border-gray-800/50">
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
            <div className="rounded-xl bg-gray-900/30 backdrop-blur-sm p-6 border border-gray-800/50">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Suggestions
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs text-white font-bold">?</div>
                  <p className="text-sm text-gray-300">
                    Orange badges show how many suggestions are available for a member
                  </p>
                </div>
                <span className="text-2xl font-semibold text-orange-400">{stats.totalSuggestions}</span>
              </div>
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
          <div className="bg-gray-900/50 p-4 border-b border-gray-800/50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Interactive Family Tree</h2>
              <div className="flex gap-2">
                <button 
                  className={`px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 text-white text-sm rounded-lg transition-colors ${
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
                  className="px-3 py-1.5 bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-600 hover:to-teal-500 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
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
                  className={`bg-gray-800/50 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-700/50 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors ${activeFilters.gender !== 'all' ? 'border-teal-500' : ''}`}
                  value={activeFilters.gender}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                >
                  <option value="all">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <select 
                className={`bg-gray-800/50 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-700/50 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors ${activeFilters.country !== 'all' ? 'border-teal-500' : ''}`}
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
                className={`bg-gray-800/50 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-700/50 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors ${activeFilters.status !== 'all' ? 'border-teal-500' : ''}`}
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
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20 mr-2">
                  Gender: {activeFilters.gender}
                </span>
              )}
              {activeFilters.country !== 'all' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20 mr-2">
                  Country: {activeFilters.country}
                </span>
              )}
              {activeFilters.status !== 'all' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20 mr-2">
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
                <div className="h-12 w-12 rounded-full border-2 border-teal-500/20 border-t-teal-500 animate-spin"></div>
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
                className="px-6 py-2 bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 rounded-lg transition-all duration-300"
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
                    className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-600 hover:to-teal-500 text-white rounded-lg transition-all duration-300"
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
                  <button className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-600 hover:to-teal-500 text-white rounded-lg transition-all duration-300">
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
              <div className="p-2">
                <div id="tree" className="w-full h-[900px]"></div>
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
          <div className="rounded-xl bg-gray-900/30 backdrop-blur-sm p-6 border border-gray-800/50">
            <div className="text-teal-400 mb-4">
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
              <li className="flex items-start">image.png
                <span className="mr-2 text-teal-400">•</span>
                <span>Click and drag to pan around the tree</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-teal-400">•</span>
                <span>Use mouse wheel to zoom in and out</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-teal-400">•</span>
                <span>Double-click a member to center the view</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl bg-gray-900/30 backdrop-blur-sm p-6 border border-gray-800/50">
            <div className="text-teal-400 mb-4">
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
                <span className="mr-2 text-teal-400">•</span>
                <span>Click on a member to see available actions</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-teal-400">•</span>
                <span>Add parents, children, or partners</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-teal-400">•</span>
                <span>Edit details like birth dates and status</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl bg-gray-900/30 backdrop-blur-sm p-6 border border-gray-800/50">
            <div className="text-teal-400 mb-4">
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
                <span className="mr-2 text-teal-400">•</span>
                <span>Export individual profiles as PDF</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-teal-400">•</span>
                <span>Save the entire tree as an image</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-teal-400">•</span>
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
            <p className="text-sm text-teal-400">
              Your family tree data is automatically saved as you make changes.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}