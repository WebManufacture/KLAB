using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Text;
using System.IO.Ports;
using System.Threading;
using System.Threading.Tasks;

public class Startup
{
    Device device;

    public Task<object> Invoke(IDictionary<string, object> input)
    {
        if (input.ContainsKey("action"))
        {
            var action = input["action"].ToString();
            if (action == "init")
            {
                return Task.Run<object>(() => { return Init(input); });
            }
            if (action == "list")
            {
                return Task.Run<object>(() => { return Device.GetPorts(); });
            }
            if (device != null)
            {
                if (action == "write")
                {
                    Task.Run<object>(() => { return device.Send((byte[])input["data"]); });
                }
                if (action == "command")
                {
                    var obj = new MotorCommand();
					if (input.ContainsKey("line"))
                    {
                        obj.Line = Convert.ToInt32(input["line"]);
                    }
					if (input.ContainsKey("address"))
                    {
                        obj.Address = Convert.ToByte(input["address"]);
                    }
                    if (input.ContainsKey("command"))
                    {
                        obj.Command = Convert.ToByte(input["command"]);
                    }
                    if (input.ContainsKey("speed"))
                    {
                        obj.Speed = Convert.ToUInt16(input["speed"]);
                    }
                    if (input.ContainsKey("x"))
                    {
                        obj.X = Convert.ToInt32(input["x"]);
                    }
                    if (input.ContainsKey("y"))
                    {
                        obj.Y = Convert.ToInt32(input["y"]);
                    }
                    if (input.ContainsKey("z"))
                    {
                        obj.Z = Convert.ToInt32(input["z"]);
                    }
					if (input.ContainsKey("paramA"))
                    {
                        obj.ParamA = Convert.ToByte(input["paramA"]);
                    }
					if (input.ContainsKey("paramB"))
                    {
                        obj.ParamB = Convert.ToByte(input["paramB"]);
                    }
                    return  Task.Run<object>(() => { return device.Send(obj); });
                }
                if (action == "close")
                {
                    device.Close();
                    Task.Run<object>(() => { return (object)null; });
                }
                if (action == "read")
                {
                    return Task.Run<object>(() => { 
						try{
							var result = device.Read();
							return result;
						}
						catch(Exception err){
							//return err.StackTrace;
							throw err;
						}
					});
                }
                if (action == "state")
                {
                    return Task.Run<object>(() => { return device.GetState(); });
                }
            }
        }
        else
        {
            throw new InvalidOperationException("Unsupported type of command.");
        }
        return null;
    }


    public bool Init(IDictionary<string, object> characters)
    {
        int speed = 38400;
        int timeout = 1000;
        string port = "COM1";
        if (characters.ContainsKey("speed"))
        {
            speed = (int)characters["speed"];
        }
        if (characters.ContainsKey("timeout"))
        {
            timeout = (int)characters["timeout"];
        }
        if (characters.ContainsKey("port"))
        {
            port = characters["port"] + "";
        }
        try
        {
            device = new Device(port, speed, timeout);
        }
        catch (Exception)
        {
            return false;
        }

        return true;
    }
}

public class MotorCommand
{
	public byte Address;
    public byte Command;
    public int Line;
    public int X;
    public int Y;
    public int Z;
    public ushort Speed;
	public byte ParamA;
	public byte ParamB;
}

public class MotorState
{
	public byte address;
    public byte command;
    public int x;
    public int y;
    public int z;
    public int xLimit;
    public int yLimit;
    public int zLimit;
    public byte state;
    public byte stateA;
    public byte stateB;
    public string date;
    public int line;
}

public class UartError
{
	public string error;
	
	public UartError(string message){
		error = message;
	}
}

public enum ASCII : byte
{
    NUL = 0x00,// Null= пустой. Всегда игнорировался. На перфолентах 1 представлялась отверстием= 0,//отсутствием отверстия. Поэтому пустые части перфоленты до начала и после конца сообщения состояли из таких символов. Сейчас используется во многих языках программирования как конец строки. (Строка понимается как последовательность символов.) В некоторых операционных системах NUL,//последний символ любого текстового файла.
    SOT = 0x01,// Start Of Transmission= начало передачи. Start Of Heading= начало заголовка.
    STX = 0x02,// Start of Text= начало текста. Текстом называлась часть сообщения= предназначенная для печати. Адрес= контрольная сумма и т. д. входили или в заголовок= или в часть сообщения после текста.
    ETX = 0x03,//End of Text= конец текста. Здесь телетайп прекращал печатать. Использование символа Ctrl-C= имеющего код 03= для прекращения работы чего-то (обычно программы)= восходит ещё к тем временам.
    EOT = 0x04,//End of Transmission= конец передачи. В системе UNIX Ctrl-D= имеющий тот же код= означает конец файла при вводе с клавиатуры.
    ENQ = 0x05,//Enquire. Прошу подтверждения.
    ACK = 0x06,//Acknowledgement. Подтверждаю.
    BEL = 0x07,//Bell= звонок= звуковой сигнал. Сейчас тоже используется. В языках программирования C и C++ обозначается \a.
    BS = 0x08,//Backspace= возврат на один символ. Сейчас стирает предыдущий символ.
    TAB = 0x09,//Tabulation. Обозначался также HT,//Horizontal Tabulation= горизонтальная табуляция. Во многих языках программирования обозначается \t .
    LF = 0x0A,//Line Feed= перевод строки. Сейчас в конце каждой строчки текстового файла ставится либо этот символ= либо CR= либо и тот и другой (CR= затем LF)= в зависимости от операционной системы. Во многих языках программирования обозначается \n и при выводе текста приводит к переводу строки.
    VT = 0x0B,//Vertical Tab= вертикальная табуляция.
    FF = 0x0C,//Form Feed= новая страница.
    CR = 0x0D,//Carriage Return= возврат каретки. Во многих языках программирования этот символ= обозначаемый \r= можно использовать для возврата в начало строчки без перевода строки. В некоторых операционных системах этот же символ= обозначаемый Ctrl-M= ставится в конце каждой строчки текстового файла перед LF.
    SO = 0x0E,//Shift Out= измени цвет ленты (использовался для двуцветных лент; цвет менялся обычно на красный). В дальнейшем обозначал начало использования национальной кодировки.
    SI = 0x0F,//Shift In= обратно к Shift Out.
    DLE = 0x10,//Data Link Escape= следующие символы имеют специальный смысл.
    DC1 = 0x11,//Device Control 1= 1-й символ управления устройством,//включить устройство чтения перфоленты.
    DC2 = 0x12,//Device Control 2= 2-й символ управления устройством,//включить перфоратор.
    DC3 = 0x13,//Device Control 3= 3-й символ управления устройством,//выключить устройство чтения перфоленты.
    DC4 = 0x14,//Device Control 4= 4-й символ управления устройством,//выключить перфоратор.
    NAK = 0x15,//Negative Acknowledgment= не подтверждаю. Обратно к Acknowledgment.
    SYN = 0x16,//Synchronization. Этот символ передавался= когда для синхронизации было необходимо что-нибудь передать.
    ETB = 0x17,//End of Text Block= конец текстового блока. Иногда текст по техническим причинам разбивался на блоки.
    CAN = 0x18,//Cancel= отмена (того= что было передано ранее).
    EM = 0x19,//End of Medium= кончилась перфолента и т. д.
    SUB = 0x1A,//Substitute= подставить. Ставится на месте символа= значение которого было потеряно или испорчено при передаче. Сейчас Ctrl-Z используется как конец файла при вводе с клавиатуры в системах DOS и Windows. У этой функции нет никакой очевидной связи с символом SUB.
    ESC = 0x1B,//Escape. Следующие символы,//что-то специальное.
    FS = 0x1C,//File Separator= разделитель файлов.
    GS = 0x1D,//Group Separator= разделитель групп.
    RS = 0x1E,//Record Separator= разделитель записей.
    US = 0x1F,//Unit Separator= разделитель юнитов. То есть поддерживалось 4 уровня структуризации данных: сообщение могло состоять из файлов= файлы из групп= группы из записей= записи из юнитов.
    DEL = 0x7F,//Delete= стереть последний символ. Символом DEL= состоящим в двоичном коде из всех единиц= можно было забить любой символ. Устройства и программы игнорировали DEL так же= как NUL. Код этого символа происходит из первых текстовых процессоров с памятью на перфоленте: в них удаление символа происходило забиванием его кода дырочками (обозначавшими логические единицы).
}

public enum EDeviceState
{
    Unknown,
    Present,
    Offline,
    Error,
    Busy,
    Online,
    Working
}

public enum UARTWritingState
{
    free,
    writing
}
public enum UARTReadingState
{
    free,
    reading,
    readingSized,
    error
}


public class Device
{
    public static string[] GetPorts()
    {
        return SerialPort.GetPortNames();
    }

    private EDeviceState _state = EDeviceState.Unknown;

    public string PortName;

    public EDeviceState State
    {
        get
        {
            return _state;
        }
        private set
        {
            _state = value;
        }
    }

    public UARTReadingState readState { get; private set; }

    public UARTWritingState writeState { get; private set; }

    private SerialPort device;

    public Device(string portName)
        : this(portName, 38400, 1000)
    {

    }

    public Device(string portName, int speed)
        : this(portName, speed, 1000)
    {

    }

    public Device(string portName, int speed, int timeout)
    {
        device = new SerialPort(portName, speed, Parity.None, 8, StopBits.One);
        if (device.IsOpen)
        {
            State = EDeviceState.Busy;
            device.Close();
            State = EDeviceState.Unknown;
        }
        device.Open();
        device.ReadTimeout = timeout;
        device.WriteTimeout = timeout;
    }

    public EDeviceState GetState()
    {
        if (writeState > UARTWritingState.free || readState > UARTReadingState.free)
        {
            State = EDeviceState.Working;
            return State;
        }
        try
        {
            if (device.IsOpen)
            {
                State = EDeviceState.Online;
            }
            else
            {
                State = EDeviceState.Offline;
            }
        }
        catch (Exception e)
        {
            State = EDeviceState.Error;
        }
        return State;
    }

    public void Close()
    {
        if (device.IsOpen)
        {
            device.Close();
            State = EDeviceState.Offline;
        }
    }

    public object Read()
    {
        if (readState != UARTReadingState.free) return null;
        var readTimeout = device.ReadTimeout / 100;
        byte[] receivedBuf = null;
        int readingIndex = 0;
        while ((readTimeout > 0 || readState != UARTReadingState.free) && device.IsOpen)
        {
            readTimeout--;
            int bytesRead = device.BytesToRead;
            if (bytesRead == 0 && readState == UARTReadingState.free)
            {
                break;
            }
            int b = device.ReadByte();
            if (b < 0) continue;
            if (readState == UARTReadingState.free && b == 01)
            {
                readState = UARTReadingState.reading;
				int size = device.ReadByte();
				if (size <= 0)
				{
					readState = UARTReadingState.free;
					continue;
				}
				receivedBuf = new byte[size];
                readingIndex = 0;
                readState = UARTReadingState.readingSized;
                continue;
            }
            if (readState == UARTReadingState.readingSized)
            {
                if (readingIndex >= receivedBuf.Length)
                {
                    if (b == 4)
                    {
                        readState = UARTReadingState.free;
                        return ConvertData(receivedBuf);
                    }
                    else
                    {
                        State = EDeviceState.Error;
                        readState = UARTReadingState.error;
                        return new UartError("error! UART Size declared - " + receivedBuf.Length + " but receive byte " + b + " instead EOT(4)");
                    }
                }
                else
                {
                    receivedBuf[readingIndex] = (byte)b;
                    readingIndex++;
                }
            }
        }
        readState = UARTReadingState.free;
        return "free";
    }

    public bool Send(byte[] buffer)
    {
        if (writeState > UARTWritingState.free) return false;
        if (buffer.Length > 255 || buffer.Length == 0) return false;
        if (!device.IsOpen)
        {
            return false;
        }
        writeState = UARTWritingState.writing;
        var buf = new byte[buffer.Length + 3];
        byte crc = 255;
        buf[0] = (byte)ASCII.SOT;//Sized
        buf[1] = (byte)buffer.Length;
        buffer.CopyTo(buf, 2);
        for (int i = 0; i < buffer.Length; i++)
        {
            crc ^= buffer[i];
        }
        buf[buf.Length - 1] = (byte)ASCII.EOT;
        uint bwrite = 0;
        device.Write(buf, 0, buf.Length);
        writeState = UARTWritingState.free;
        return true;
    }

    public bool Send(byte command)
    {
        return Send(new byte[] { command });
    }

    public bool Send(string str)
    {
        return Send(ASCIIEncoding.ASCII.GetBytes(str));
    }

    private static int loadInt(byte[] arr, int index)
    {
        return (int)(arr[index] * 16777216 + arr[index + 1] * 65536 + arr[index + 2] * 256 + arr[index + 3]);
    }

    private static int saveInt(byte[] arr, int index, int value)
    {
        arr[index] = (byte)(value >> 24);
        arr[index + 1] = (byte)(value >> 16);
        arr[index + 2] = (byte)(value >> 8);
        arr[index + 3] = (byte)(value);
        return value;
    }

    public MotorState ConvertData(byte[] data)
    {
        if (data == null) return null;
        if (data.Length >= 33)
        {
            MotorState obj = new MotorState();
            obj.date = DateTime.Now.ToString("dd.MM.yyyy HH:mm:ss.") + DateTime.Now.Millisecond;
			obj.address = data[0];
            obj.command = data[1];
            obj.state = data[2];
            obj.line = loadInt(data, 3);
            obj.x = loadInt(data, 7);
            obj.y = loadInt(data, 11);
            obj.z = loadInt(data, 15);
            obj.xLimit = loadInt(data, 19);
            obj.yLimit = loadInt(data, 23);
            obj.zLimit = loadInt(data, 27);
            obj.stateA = data[31];
            obj.stateB = data[32];
            return obj;
        }
        return null;
    }

    public bool Send(MotorCommand data)
    {
        if (data == null)
        {
            return false;
        }
        byte[] bytes = new byte[22];
		bytes[0] = (byte)data.Address;
        bytes[1] = (byte)data.Command;
        bytes[2] = (byte)(data.Speed / 256);
        bytes[3] = (byte)(data.Speed % 256);
        saveInt(bytes, 4, data.Line);
        saveInt(bytes, 8, data.X);
        saveInt(bytes, 12, data.Y);
        saveInt(bytes, 16, data.Z);
		bytes[20] = data.ParamA;
        bytes[21] = data.ParamB;
        Send(bytes);
        return true;
    }
}
