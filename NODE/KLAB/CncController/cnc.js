function MotorState()
{
	this.command = 0;
	this.x = null;
	this.y = null;
	this.z = null;
	this.xLimit = null;
	this.yLimit = null;
	this.zLimit = null;
	this.state = 0;
	this.line = 0;
}

global.CommandType = 
{
	Null : 0,
	Go : 1,
	Rebase : 2,
	Stop : 3,
	State : 4,
	Pause : 6,
	Resume : 7,
	Error : 16
}

/*
    public enum CncProgramState : byte
    {
        NotStarted,
        Running,
        Paused,
        Completed,
        Aborted
    }

    public class CncProgram
    {
        private static CncProgramState _state;
        public static CncProgramState State
        {
            get { return _state; }
            set
            {
                _state = value;
                if (OnStateChange != null)
                {
                    OnStateChange(value);
                }
            }
        }

        public static  bool Exists
        {
            get { return Commands.Count > 0; }
        }

        public static bool InProgress
        {
            get { return _state > CncProgramState.NotStarted && _state < CncProgramState.Completed; }
        }

        public static List<MotorCommand> Commands;
        public static int CurrentLine;
        public static bool DebugMode = false;

        public static event ProgramStateHandler OnStateChange;
        public static event CommandHandler OnCommand;

        static CncProgram()
        {
            CurrentLine = 0;
            Commands = new List<MotorCommand>();
            _state = CncProgramState.NotStarted;
            CncController.OnMessage += CncControllerOnOnMessage;
        }

        private static void CncControllerOnOnMessage(MotorState obj)
        {
            if (obj.command == 3)
            {
                CncProgram.Stop();
                return;
            }
            if (CncProgram.Exists && CncProgram.InProgress && obj.line > 0)
            {
                if (obj.state == 1)
                {
                    CncProgram.Prepare(obj);
                }
                if (obj.state == 2)
                {
                    CncProgram.Next(obj);
                }
            }
        }

        public static void NewProgram(MotorCommand[] commands)
        {
            CurrentLine = 0;
            Commands = new List<MotorCommand>(commands);
            State = CncProgramState.NotStarted;
        }

        public static void NewProgram(List<MotorCommand> commands)
        {
            CurrentLine = 0;
            Commands = commands;
            State = CncProgramState.NotStarted;
        }

        public static  void Stop()
        {
            State = CncProgramState.Aborted;
        }

        public static void Run()
        {
            CurrentLine = 1;
            if (DebugMode)
            {
                State = CncProgramState.Paused;
            }
            else
            {
                State = CncProgramState.Running;
                Next(null);
            }
        }

        public static void Pause()
        {
            if (State < CncProgramState.Completed)
            {
                State = CncProgramState.Paused;
            }
        }

        public static void Resume()
        {
            if (State < CncProgramState.Completed)
            {
                State = CncProgramState.Running;
            }
        }

        public static bool Next(MotorState state)
        {
            if (State > CncProgramState.Running)
            {
                return false;
            }
            if (CurrentLine > 0 && CurrentLine <= Commands.Count)
            {
                var command = Commands[CurrentLine - 1];
                command.programLine = (uint)CurrentLine;
                CurrentLine++;
                if (command.Command == CommandType.Pause)
                {
                    Pause();
                }
                if (command.Command == CommandType.Resume)
                {
                    Resume();
                }
                if (!command.Sended)
                {
                    CncController.SendCommand(command);
                }
                if (OnCommand != null)
                {
                    try
                    {
                        OnCommand(command);
                    }
                    catch (Exception)
                    {

                    }
                }
                if (DebugMode) Pause();
                return true;
            }
            if (State == CncProgramState.Running)
            {
                State = CncProgramState.Completed;
            }
            return false;
        }

        public static bool Prepare(MotorState state)
        {
            if (State > CncProgramState.Running)
            {
                return false;
            }
            if (CurrentLine > 0 && CurrentLine < Commands.Count) // CurrentLine 1...N, тут нужно иметь возможность выбрать еще 1 комманду
            {
                var command = Commands[CurrentLine - 1];
                if (command.Sended) return true;
                command.programLine = (uint)CurrentLine;
                if (command.Command == CommandType.Go) //Отсылаем только комманды мотору
                {
                    CncController.SendCommand(command);
                }
                return true;
            }
            return false;
        }

        public override string ToString()
        {
            return JsonConvert.SerializeObject(this);
        }

    }
*/
	