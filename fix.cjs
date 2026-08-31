const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');
const startMarker = "console.log('Grouped for upload:', grouped);";
const lastIndex = app.lastIndexOf(startMarker);
if (lastIndex !== -1) {
  const validPart = app.substring(0, lastIndex + startMarker.length);
  const closingCode = `
                          // Fake success
                          setShowSelectionModalDashboard(false);
                          setPendingLearnersDashboard([]);
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setIsUploadingDashboard(false);
                        }
                      }
                    }}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 transition-colors"
                  >
                    {isUploadingDashboard ? 'Uploading...' : 'Confirm Upload'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
`;
  fs.writeFileSync('src/App.tsx', validPart + closingCode);
  console.log('Repaired App.tsx tags!');
} else {
  console.log('Could not find start marker!');
}
