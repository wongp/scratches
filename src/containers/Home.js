import React, { useState, useEffect } from "react";
import { API } from "aws-amplify";
import { Link } from "react-router-dom";
import { BsPencilSquare } from "react-icons/bs";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";
import InputGroup from "react-bootstrap/InputGroup";
import { LinkContainer } from "react-router-bootstrap";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAppContext } from "../libs/contextLib";
import { onError } from "../libs/errorLib";
import "./Home.css";

import MagnifyingGlass from '../assets/images/mag.svg';

export default function Home() {
  const [notes, setNotes] = useState([]);
  const { isAuthenticated } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [displayResults, setDisplayResults] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function onLoad() {
      if (!isAuthenticated) {
        return;
      }

      try {
        const notes = await loadNotes();
        setNotes(notes);
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, [isAuthenticated]);

  function loadNotes() {
    return API.get("notes", "/notes");
  }

  async function saveNote(note) {
    try {
      await updateNote(note); 
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }

  function updateNote(note) {
    return API.put("notes", `/notes/${note.noteId}`, {
      body: { 
        content: note.content, 
        attachment: note.attachment
      }
    });
  }

  function updateNotes(updatedNotes) {
    let found

    const notesToUpdate = notes.map((note) => {
      found = updatedNotes.find((updatedNote) => {
        return updatedNote.noteId === note.noteId
      })

      return found ? found : note
    })

    setNotes(notesToUpdate)
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }

  function handleReplaceAll(event) {
    event.preventDefault();

    const replaceTerm = event.target[0].value
    const regEx = new RegExp(escapeRegExp(searchTerm), "ig");

    const updatedNotes = searchResults.map((note) => {
      return {
        ...note,
        content: note.content.replaceAll(regEx, replaceTerm)
      }
    })

    setIsLoading(true);

    Promise.all(updatedNotes.map(saveNote)).then(() => {
      updateNotes(updatedNotes)
      setSearchResults(updatedNotes)      
      setIsLoading(false);   
    });
  }

  function handleKeyDown(event) {
    // Prevent 'enter' key action
    if (event.key === 'Enter' && event.shiftKey === false) {
      event.preventDefault();
    }
  }

  function handleSearchTermChange(event) {
    const searchTerm = event.target.value
    const searchResults = searchTerm ? findNotes(notes, searchTerm) : []

    setDisplayResults(searchTerm === '' || searchResults.length !== 0)
    setSearchTerm(searchTerm)
    setSearchResults(searchResults)
  }

  function findNotes(notes, searchTerm) {
    let matched = []
    
    notes.forEach((note) => {
      if (note.content.toLowerCase().includes(searchTerm.toLowerCase())) {
        matched = matched.concat(note)
      }
    })

    return matched
  }

  function renderNoResults() {
    return (
      <> 
        <p>No notes found.</p>
        <p>Try using a different keyword.</p>
      </>
    )
  }

  function renderNotesBody(notes) {
    return (
      <>
        {notes.map(({ noteId, content, createdAt }) => (
          <LinkContainer key={noteId} to={`/notes/${noteId}`}>
            <ListGroup.Item action>
              <span className="font-weight-bold">
                {content.trim().split("\n")[0]}
              </span>
              <br />
              <span className="text-muted">
                Created: {new Date(createdAt).toLocaleString()}
              </span>
            </ListGroup.Item>
          </LinkContainer>
        ))}
      </>
    )
  }

  function renderSearchResultsList(searchResults) {
    return (
      <>
        <ListGroup className="py-3 text-nowrap text-truncate">
          <span className="ml-3 font-weight-bold">{searchResults.length} notes found.</span>
        </ListGroup>
        {renderNotesBody(searchResults)}
      </>
    );
  }

  function renderNotesList(notes) {
    return (
      <>
        <LinkContainer to="/notes/new">
          <ListGroup.Item action className="py-3 text-nowrap text-truncate">
            <BsPencilSquare size={17} />
            <span className="ml-2 font-weight-bold">Create a new note</span>
          </ListGroup.Item>
        </LinkContainer>
        {renderNotesBody(notes)}
      </>
    );
  }

  function renderLander() {
    return (
      <div className="lander">
        <h1>Scratch</h1>
        <p className="text-muted">A simple note taking app</p>
        <div className="pt-3">
          <Link to="/login" className="btn btn-info btn-lg mr-3">
            Login
          </Link>
          <Link to="/signup" className="btn btn-success btn-lg">
            Signup
          </Link>
        </div>
      </div>
    );
  }

  function renderSearchBar() {
    return (
      <div>
        <Form onKeyDown={handleKeyDown}>
          <InputGroup className="mb-3">
            <InputGroup.Prepend>
              <InputGroup.Text>
                <img src={MagnifyingGlass} alt="Search" className='search' />
              </InputGroup.Text>        
            </InputGroup.Prepend>
            <Form.Control
              type="text"
              name="search"
              placeholder="Search"
              value={searchTerm}
              onChange={handleSearchTermChange}
            />
          </InputGroup>      
        </Form>
        { searchTerm !== '' &&
          <Form onSubmit={handleReplaceAll} onKeyDown={handleKeyDown}>
            <InputGroup className="mb-3">         
              <Form.Control placeholder="Replace with" />
              <InputGroup.Prepend>
                <Button type='submit' variant="outline-secondary">Replace all</Button>
              </InputGroup.Prepend>
            </InputGroup>
          </Form>
        }
      </div>
    )
  }

  function renderSearchResults() {
    return (
      <div className="searchResults">
        <h2 className="pb-3 mt-4 mb-3 border-bottom">Your Search Results</h2>        
        {
          isLoading ? <LoadingSpinner /> : <ListGroup>{renderSearchResultsList(searchResults)}</ListGroup>              
        }
      </div>
    );
  }

  function renderNotes() {
    return (
      <div className="notes">
        <h2 className="pb-3 mt-4 mb-3 border-bottom">Your Notes</h2> 
        {
          isLoading ? <LoadingSpinner /> : <ListGroup>{renderNotesList(notes)}</ListGroup>
        }       
      </div>
    );
  }

  function renderPage() {
    if (isAuthenticated) {
      if (displayResults) {
        return searchResults.length === 0 ? renderNotes() : renderSearchResults()
      } else {
        return renderNoResults()
      }
    } else {
      return renderLander()
    }
  }
  
  return (
    <div className="Home">
      {renderSearchBar()}
      {renderPage()}
    </div>
  );
}
