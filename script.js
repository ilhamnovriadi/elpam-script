// ==UserScript==
// @name         Get Link Fordis Unpam
// @namespace    http://tampermonkey.net/
// @version      2024-02-28
// @description  try to take over the world!
// @author       Ilham Novriadi
// @match        https://e-learning.unpam.ac.id/my/courses.php
// @icon         https://e-learning.unpam.ac.id/pluginfile.php?file=%2F1%2Ftheme_edumy%2Fheaderlogo2%2F1708916034%2Fcropped-logo-unpam.png
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';
    function extractName(inputText) {
        // Define the regular expression pattern to match the name
        var regex = /^([\w\s]+)\s+\d{12}-\d{5}-[A-Z]\s+(\S+@\S+)/;

        // Execute the regular expression on the input text
        var match = regex.exec(inputText);

        // Check if the match was found
        if (match && match.length >= 2) {
            // Return the name (first capturing group)
            return match[1];
        } else {
            // Return null if no match was found
            return null;
        }
    }

    let targetElement = document.querySelectorAll('.main_content_container');
    let userElement = Array.from(document.querySelectorAll('.user_set_header')).map(element => {
        const textElement = element.querySelector('p')
        const inputText = textElement.textContent

        return extractName(inputText)
    })

    // Function to lazy-loaded elements with buttons
    async function LazyElements() {
        // Find all lazy-loaded elements (replace ".mcc_view" with your actual selector)
        let links = document.querySelectorAll('.mcc_view');
        let customElement = document.createElement('div');
        customElement.style.backgroundColor = '#f9f9f9';
        customElement.style.border = '1px solid grey';
        customElement.style.borderRadius = '10px';
        customElement.style.height = '80vh';
        customElement.style.width = '500px';
        customElement.style.padding = '20px';
        customElement.style.margin = '20px 0';
        customElement.style.position = 'fixed';
        customElement.style.right = '20px';
        customElement.style.bottom = '20px';
        customElement.style.zIndex = '10';
        customElement.style.overflow = 'scroll';

        var createElement = []
        const URL_MATKUL = []
        links.forEach(item=> URL_MATKUL.push(item.getAttribute('href')))

        for(let url_matkul of URL_MATKUL){
            // Example fetch request
            await fetch(url_matkul)
                .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
                .then(async html=> {
                // Parse the HTML response
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const pageTitle = doc.title;

                // Find <a> elements containing <span> with text values that include "FORUM DISKUSI"

                const mustBe = Array.from(doc.querySelectorAll('.availabilityinfo.small.course-description-item.isrestricted')).map(content => {
                    var anchorElement = content.querySelector('a');
                    var hrefValue = anchorElement?.getAttribute('href');
                    var anchorText = anchorElement?.textContent;
                    return {href: hrefValue, name: anchorText}
                })

                const links = Array.from(doc.querySelectorAll('a')).filter(link => {
                    const span = link.querySelector('span.instancename');
                    return span && span.textContent.includes('FORUM DISKUSI');
                });

                // Extract href attributes and text content from the matched <a> elements
                const linkData = links.map(link => ({
                    href: link.getAttribute('href'),
                    name: link.querySelector('span.instancename').textContent.trim() // Trim whitespace
                }));
                createElement.push(`<h5>${pageTitle}</h5>`)
                createElement.push(`<ul>`)
                mustBe?.map(item => {
                    if(item.href) createElement.push(`<li><a style='color: red;' href='${item?.href}' target="_blank">${item?.name}</a></li>`)
                });

                for(let fordis of linkData){
                    createElement.push(`<li><a style='color: blue;' href='${fordis.href}' target="_blank">${fordis.name}</a></li>`)
                    await fetch(fordis.href)
                        .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.text();
                    })
                        .then(html => {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');

                        const links = Array.from(doc.querySelectorAll('.discussion')).map(dis => {
                            const extractAnchor = dis.querySelector('.w-100.h-100.d-block')
                            return {href: extractAnchor.getAttribute('href'), name: extractAnchor.textContent}
                        })
                        links.map(async item => {
                            let counter = 0
                            await fetch(item.href).then(response => {
                                if (!response.ok) {
                                    throw new Error('Network response was not ok');
                                }
                                return response.text();
                            })
                            .then(html => {
                                const parser = new DOMParser();
                                const doc = parser.parseFromString(html, 'text/html');

                                const chat = Array.from(doc.querySelectorAll('small>a')).filter(names => {
                                    return names.textContent.includes(userElement[0])
                                })
                                counter = chat.length

                            })
                            createElement.push(`<li><a style='color: green;' href='${item.href}' target="_blank">${item.name}</a> ${counter > 0 ? "✅ " + counter + "chats" : "" }</li>`)
                        });
                    })
                }

                createElement.push(`</ul>`)
                customElement.innerHTML = createElement.join('')
                targetElement[0].parentNode.insertBefore(customElement, targetElement[0]);
            })
                .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
        }
    }

    // Function to handle mutations in the DOM
    function handleMutations(mutationsList) {
        mutationsList.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1 && node.getAttribute('data-region') === 'paged-content-page') {
                    LazyElements();
                }
            });
        });
    }

    // Create a MutationObserver to watch for changes in the DOM
    const observer = new MutationObserver(handleMutations);

    // Start observing the document body for changes
    //https://missav.com/id/actresses/Fumino%20Satsuki
    observer.observe(document.body, { subtree: true, childList: true });
})();
